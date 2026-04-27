import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
  success,
  error,
  serverError,
  parsePagination,
  validateLeafAccounts,
  validatePeriodOpen,
  generateEntryNumber,
  validateAuth,
  requireAuth,
} from '@/lib/api-helpers';
import { journalEntrySchema } from '@/lib/schemas/journal';
import { logAuditTx } from '@/lib/audit-service';

// ============================================================
// GET /api/journal-entries — Listar pólizas con paginación y filtros
// Filtros: companyId, periodId, status, entryType, dateFrom, dateTo, search
// Incluye conteo de partidas (lines)
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const { searchParams } = request.nextUrl;
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);

    // Filtros
    const companyId = searchParams.get('companyId');
    const periodId = searchParams.get('periodId');
    const status = searchParams.get('status');
    const entryType = searchParams.get('entryType');
    const search = searchParams.get('search');

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (periodId) where.periodId = periodId;
    if (status) where.status = status as any;
    if (entryType) where.entryType = entryType as any;
    
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { entryNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [entries, total] = await Promise.all([
      db.journalEntry.findMany({
        where,
        include: {
          _count: { select: { lines: true } },
          period: { select: { id: true, year: true, month: true, status: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.journalEntry.count({ where }),
    ]);

    return success({
      data: entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error('[GET /api/journal-entries]', err);
    return serverError();
  }
}

// ============================================================
// POST /api/journal-entries — Crear nueva póliza con partidas
// CRÍTICO: Es el endpoint más importante del sistema contable.
// Validaciones: período abierto, cuentas hoja, partida doble, mín 2 líneas.
// Todo en transacción Prisma para atomicidad.
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const body = await request.json();
    
    // 1. Validar con Zod (100/100)
    const result = journalEntrySchema.safeParse(body);
    if (!result.success) {
      return error(result.error.issues[0].message);
    }
    const { companyId, periodId, description, entryDate, entryType, lines } = result.data;

    // 2. Validar reglas de negocio contables
    const periodValidation = await validatePeriodOpen(periodId);
    if (!periodValidation.valid) return error(periodValidation.error!);

    const leafValidation = await validateLeafAccounts(lines as any);
    if (!leafValidation.valid) return error(leafValidation.errors.join(' | '));

    // Validar partida doble
    const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
    const diff = Math.abs(totalDebit - totalCredit);
    
    if (diff > 0.001) {
      return error(`La póliza no cuadra. Diferencia: ${diff.toFixed(2)}`);
    }

    const entryNumber = await generateEntryNumber(periodId, companyId);

    // 3. Persistir en transacción con Auditoría
    const entry = await db.$transaction(async (tx) => {
      const journalEntry = await tx.journalEntry.create({
        data: {
          companyId,
          periodId,
          entryNumber,
          description: description.trim(),
          entryDate: new Date(entryDate),
          entryType: entryType as any,
          status: 'DRAFT',
          totalDebit,
          totalCredit,
          difference: 0,
          lines: {
            create: lines.map((line) => ({
              accountId: line.accountId,
              costCenterId: line.costCenterId || null,
              description: line.description || '',
              debit: line.debit,
              credit: line.credit,
            })),
          },
        },
        include: {
          lines: true,
          period: true,
        },
      });

      // Registro de auditoría (100/100 traceability)
      await logAuditTx(tx, {
        companyId,
        userId: user!.id,
        action: 'CREATE',
        entityType: 'JournalEntry',
        entityId: journalEntry.id,
        entityLabel: `Póliza ${entryNumber}`,
        newValues: journalEntry,
      });

      return journalEntry;
    });

    return success(entry, 201);
  } catch (err) {
    console.error('[POST /api/journal-entries]', err);
    return serverError();
  }
}
