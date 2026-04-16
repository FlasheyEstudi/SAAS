import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error, notFound, serverError } from '@/lib/api-helpers';

// ============================================================
// DELETE /api/journal-entries/[id]/lines/[lineId] — Eliminar partida
// Solo permite eliminar si la póliza está en DRAFT.
// Recalcula totales después de eliminar.
// Mínimo 2 partidas requeridas después de la eliminación.
// ============================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  try {
    const { id, lineId } = await params;

    // Verificar que la póliza existe y está en DRAFT
    const entry = await db.journalEntry.findUnique({
      where: { id },
      select: { id: true, status: true, _count: { select: { lines: true } } },
    });

    if (!entry) return notFound('Póliza no encontrada');
    if (entry.status !== 'DRAFT') {
      return error('No se pueden eliminar partidas de una póliza publicada (POSTED). Solo se pueden modificar pólizas en estado BORRADOR (DRAFT).');
    }

    // Verificar que la partida existe y pertenece a esta póliza
    const existingLine = await db.journalEntryLine.findUnique({
      where: { id: lineId },
      select: { id: true, journalEntryId: true },
    });

    if (!existingLine) return notFound('Partida no encontrada');
    if (existingLine.journalEntryId !== id) {
      return error('La partida no pertenece a esta póliza.');
    }

    // Verificar que después de eliminar quedarán al menos 2 partidas
    if (entry._count.lines <= 2) {
      return error('La póliza debe tener un mínimo de 2 partidas. No se puede eliminar esta partida porque quedaría con menos de 2.');
    }

    // Eliminar en transacción y recalcular totales
    const result = await db.$transaction(async (tx) => {
      await tx.journalEntryLine.delete({
        where: { id: lineId },
      });

      // Recalcular totales
      const remainingLines = await tx.journalEntryLine.findMany({
        where: { journalEntryId: id },
        select: { debit: true, credit: true },
      });

      const totalDebit = remainingLines.reduce((sum, l) => sum + (l.debit || 0), 0);
      const totalCredit = remainingLines.reduce((sum, l) => sum + (l.credit || 0), 0);
      const difference = Math.round((totalDebit - totalCredit) * 100) / 100;

      const updatedEntry = await tx.journalEntry.update({
        where: { id },
        data: { totalDebit, totalCredit, difference },
        select: {
          id: true,
          totalDebit: true,
          totalCredit: true,
          difference: true,
          _count: { select: { lines: true } },
        },
      });

      return {
        deletedLineId: lineId,
        totals: updatedEntry,
        remainingLinesCount: updatedEntry._count.lines,
      };
    });

    return success(result);
  } catch (err) {
    console.error('[DELETE /api/journal-entries/[id]/lines/[lineId]]', err);
    return serverError();
  }
}
