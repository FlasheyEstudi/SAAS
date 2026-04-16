import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
  success,
  created,
  error,
  serverError,
  parsePagination,
  validateDoubleEntry,
  validateLeafAccounts,
  validatePeriodOpen,
  generateEntryNumber,
  type LineItem,
} from '@/lib/api-helpers';

// ============================================================
// GET /api/journal-entries — Listar pólizas con paginación y filtros
// Filtros: companyId, periodId, status, entryType, dateFrom, dateTo, search
// Incluye conteo de partidas (lines)
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const { page, limit } = parsePagination(searchParams);

    // Filtros
    const companyId = searchParams.get('companyId');
    const periodId = searchParams.get('periodId');
    const status = searchParams.get('status');
    const entryType = searchParams.get('entryType');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (companyId) where.companyId = companyId;
    if (periodId) where.periodId = periodId;
    if (status) where.status = status;
    if (entryType) where.entryType = entryType;
    if (dateFrom || dateTo) {
      where.entryDate = {} as Record<string, unknown>;
      if (dateFrom) (where.entryDate as Record<string, unknown>).gte = new Date(dateFrom + 'T00:00:00.000Z');
      if (dateTo) (where.entryDate as Record<string, unknown>).lte = new Date(dateTo + 'T23:59:59.999Z');
    }
    if (search) {
      where.OR = [
        { description: { contains: search } },
        { entryNumber: { contains: search } },
      ];
    }

    const [entries, total] = await Promise.all([
      db.journalEntry.findMany({
        where,
        include: {
          _count: { select: { lines: true } },
          period: { select: { id: true, year: true, month: true, status: true } },
        },
        orderBy: [{ entryDate: 'desc' }, { entryNumber: 'desc' }],
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
    const body = await request.json();
    const { companyId, periodId, description, entryDate, entryType, lines } = body as {
      companyId?: string;
      periodId?: string;
      description?: string;
      entryDate?: string;
      entryType?: string;
      lines?: LineItem[];
    };

    // --- Validaciones básicas ---
    if (!companyId) return error('El campo companyId es obligatorio.');
    if (!periodId) return error('El campo periodId es obligatorio.');
    if (!description || !description.trim()) return error('El campo description es obligatorio.');
    if (!entryDate) return error('El campo entryDate es obligatorio.');
    if (!entryType) return error('El campo entryType es obligatorio.');
    if (!['DIARIO', 'EGRESO', 'INGRESO', 'TRASPASO'].includes(entryType)) {
      return error('entryType debe ser DIARIO, EGRESO, INGRESO o TRASPASO.');
    }
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return error('La póliza debe tener al menos una partida.');
    }
    if (lines.length < 2) {
      return error('La póliza debe tener al menos 2 partidas.');
    }

    // Validar que cada línea tenga los campos requeridos
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.accountId) return error(`La partida ${i + 1} no tiene cuenta (accountId).`);
      if (typeof line.debit !== 'number' || typeof line.credit !== 'number') {
        return error(`La partida ${i + 1} debe tener valores numéricos para debit y credit.`);
      }
      if (line.debit < 0 || line.credit < 0) {
        return error(`La partida ${i + 1} no puede tener valores negativos.`);
      }
    }

    // --- Validar período abierto ---
    const periodValidation = await validatePeriodOpen(periodId);
    if (!periodValidation.valid) {
      return error(periodValidation.error!);
    }

    // --- Validar cuentas hoja ---
    const leafValidation = await validateLeafAccounts(lines);
    if (!leafValidation.valid) {
      return error(leafValidation.errors.join(' | '));
    }

    // --- Validar partida doble ---
    const doubleEntry = validateDoubleEntry(lines);
    if (!doubleEntry.valid) {
      return error(
        `La póliza no cuadra. Diferencia: $${doubleEntry.difference.toFixed(2)}. ` +
        `Total Débitos: $${doubleEntry.totalDebit.toFixed(2)}, Total Créditos: $${doubleEntry.totalCredit.toFixed(2)}.`
      );
    }

    // --- Generar número de póliza secuencial ---
    const entryNumber = await generateEntryNumber(periodId, companyId);

    // --- Crear en transacción ---
    const entry = await db.$transaction(async (tx) => {
      const journalEntry = await tx.journalEntry.create({
        data: {
          companyId,
          periodId,
          entryNumber,
          description: description.trim(),
          entryDate: new Date(entryDate + 'T12:00:00.000Z'),
          entryType,
          status: 'DRAFT',
          totalDebit: doubleEntry.totalDebit,
          totalCredit: doubleEntry.totalCredit,
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
          lines: {
            include: {
              account: { select: { id: true, code: true, name: true } },
              costCenter: { select: { id: true, code: true, name: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
          period: { select: { id: true, year: true, month: true, status: true } },
        },
      });

      return journalEntry;
    });

    return created(entry);
  } catch (err: unknown) {
    console.error('[POST /api/journal-entries]', err);
    if (err instanceof Error && err.message.includes('Unique constraint')) {
      return error('Error de conflicto al generar el número de póliza. Intente de nuevo.');
    }
    return serverError();
  }
}
