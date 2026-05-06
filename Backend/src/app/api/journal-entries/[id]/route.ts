import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error, notFound, serverError, validatePeriodOpen } from '@/lib/api-helpers';

// ============================================================
// GET /api/journal-entries/[id] — Obtener póliza con todas sus partidas
// Incluye relaciones de account y costCenter en cada partida.
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const entry = await db.journalEntry.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            account: { select: { id: true, code: true, name: true, accountType: true, nature: true } },
            costCenter: { select: { id: true, code: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        period: { select: { id: true, year: true, month: true, status: true } },
        company: { select: { id: true, name: true } },
      },
    });

    if (!entry) return notFound('Póliza no encontrada');

    return success(entry);
  } catch (err) {
    console.error('[GET /api/journal-entries/[id]]', err);
    return serverError();
  }
}

// ============================================================
// PUT /api/journal-entries/[id] — Actualizar póliza (solo DRAFT)
// Campos editables: description, entryDate, entryType
// NO se permite editar si la póliza ya está PUBLICADA (POSTED).
// ============================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { description, entryDate, entryType, lines, periodId } = body as {
      description?: string;
      entryDate?: string;
      entryType?: string;
      periodId?: string;
      lines?: any[];
    };

    // Verificar que la póliza existe
    const existing = await db.journalEntry.findUnique({
      where: { id },
      select: { id: true, status: true, periodId: true },
    });

    if (!existing) return notFound('Póliza no encontrada');
    if (existing.status !== 'DRAFT') {
      return error('No se puede modificar una póliza que ya está publicada (POSTED). Solo se pueden editar pólizas en estado BORRADOR (DRAFT).');
    }

    // Sincronización con el Período Contable
    const periodValidation = await validatePeriodOpen(existing.periodId);
    if (!periodValidation.valid) {
      return error(periodValidation.error || 'El periodo contable no está abierto para modificaciones');
    }

    // Calcular nuevos totales si hay líneas
    let totalDebit = undefined;
    let totalCredit = undefined;
    if (lines && Array.isArray(lines)) {
      totalDebit = lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
      totalCredit = lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
    }

    // Realizar actualización en transacción
    const updated = await db.$transaction(async (tx) => {
      // 1. Si hay nuevas líneas, borrar las anteriores y crear las nuevas
      if (lines && Array.isArray(lines)) {
        await tx.journalEntryLine.deleteMany({ where: { journalEntryId: id } });
        await tx.journalEntry.update({
          where: { id },
          data: {
            lines: {
              create: lines.map((l) => ({
                accountId: l.accountId,
                costCenterId: l.costCenterId || null,
                description: l.description || '',
                debit: Number(l.debit || 0),
                credit: Number(l.credit || 0),
              })),
            },
          },
        });
      }

      // 2. Actualizar cabecera
      const updateData: any = {};
      if (description !== undefined) updateData.description = description.trim();
      if (entryDate !== undefined) updateData.entryDate = new Date(entryDate);
      if (entryType !== undefined) updateData.entryType = entryType;
      if (periodId !== undefined) updateData.periodId = periodId;
      if (totalDebit !== undefined) updateData.totalDebit = totalDebit;
      if (totalCredit !== undefined) updateData.totalCredit = totalCredit;
      if (totalDebit !== undefined && totalCredit !== undefined) {
        updateData.difference = Math.abs(totalDebit - totalCredit);
      }

      return tx.journalEntry.update({
        where: { id },
        data: updateData,
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
    });

    return success(updated);
  } catch (err) {
    console.error('[PUT /api/journal-entries/[id]]', err);
    return serverError();
  }
}

// ============================================================
// DELETE /api/journal-entries/[id] — Eliminar póliza (solo DRAFT)
// Elimina la póliza y todas sus partidas en transacción.
// NO se permite eliminar si la póliza ya está PUBLICADA (POSTED).
// ============================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar que la póliza existe
    const existing = await db.journalEntry.findUnique({
      where: { id },
      select: { id: true, status: true, _count: { select: { lines: true } } },
    });

    if (!existing) return notFound('Póliza no encontrada');
    if (existing.status !== 'DRAFT') {
      return error('No se puede eliminar una póliza que ya está publicada (POSTED). Solo se pueden eliminar pólizas en estado BORRADOR (DRAFT).');
    }

    // Eliminar en transacción (póliza + partidas)
    await db.$transaction(async (tx) => {
      // Las partidas se eliminan en cascada por el onDelete: Cascade en el schema,
      // pero lo hacemos explícitamente para seguridad y claridad.
      await tx.journalEntryLine.deleteMany({
        where: { journalEntryId: id },
      });
      await tx.journalEntry.delete({
        where: { id },
      });
    });

    return success({ id, deleted: true, linesDeleted: existing._count.lines });
  } catch (err) {
    console.error('[DELETE /api/journal-entries/[id]]', err);
    return serverError();
  }
}
