import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error, notFound, serverError, validateDoubleEntry, validateLeafAccounts, validatePeriodOpen } from '@/lib/api-helpers';

// ============================================================
// POST /api/journal-entries/[id]/post — Publicar póliza
// Cambia el estado de DRAFT → POSTED.
// Validaciones: período abierto, partida doble, cuentas hoja.
// Todo en transacción Prisma.
// ============================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar que la póliza existe y está en DRAFT
    const entry = await db.journalEntry.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            account: { select: { id: true, code: true, name: true, isGroup: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!entry) return notFound('Póliza no encontrada');

    // Validación 1: Debe estar en DRAFT
    if (entry.status !== 'DRAFT') {
      return error(`La póliza ya está publicada (POSTED). No se puede volver a publicar. Estado actual: ${entry.status}.`);
    }

    // Validación 2: Período debe estar abierto
    const periodValidation = await validatePeriodOpen(entry.periodId);
    if (!periodValidation.valid) {
      return error(periodValidation.error!);
    }

    // Validación 3: Partidas deben cuadrar (partida doble)
    const lineItems = entry.lines.map((line) => ({
      accountId: line.accountId,
      costCenterId: line.costCenterId,
      description: line.description,
      debit: line.debit,
      credit: line.credit,
    }));

    const doubleEntry = validateDoubleEntry(lineItems);
    if (!doubleEntry.valid) {
      return error(
        `La póliza no cuadra. Diferencia: $${doubleEntry.difference.toFixed(2)}. ` +
        `Total Débitos: $${doubleEntry.totalDebit.toFixed(2)}, Total Créditos: $${doubleEntry.totalCredit.toFixed(2)}.`
      );
    }

    // Validación 4: Todas las cuentas deben ser hojas
    const leafValidation = await validateLeafAccounts(lineItems);
    if (!leafValidation.valid) {
      return error(leafValidation.errors.join(' | '));
    }

    // Publicar en transacción
    const updated = await db.$transaction(async (tx) => {
      // Actualizar la cabecera
      const postedEntry = await tx.journalEntry.update({
        where: { id },
        data: {
          status: 'POSTED',
          postedAt: new Date(),
          totalDebit: doubleEntry.totalDebit,
          totalCredit: doubleEntry.totalCredit,
          difference: 0,
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
          company: { select: { id: true, name: true } },
        },
      });

      return postedEntry;
    });

    return success(updated);
  } catch (err) {
    console.error('[POST /api/journal-entries/[id]/post]', err);
    return serverError();
  }
}
