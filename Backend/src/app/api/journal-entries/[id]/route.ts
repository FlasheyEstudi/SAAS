import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error, notFound, serverError } from '@/lib/api-helpers';

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
    const { description, entryDate, entryType } = body as {
      description?: string;
      entryDate?: string;
      entryType?: string;
    };

    // Verificar que la póliza existe
    const existing = await db.journalEntry.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) return notFound('Póliza no encontrada');
    if (existing.status !== 'DRAFT') {
      return error('No se puede modificar una póliza que ya está publicada (POSTED). Solo se pueden editar pólizas en estado BORRADOR (DRAFT).');
    }

    // Validar entryType si se proporciona
    if (entryType && !['DIARIO', 'EGRESO', 'INGRESO', 'TRASPASO'].includes(entryType)) {
      return error('entryType debe ser DIARIO, EGRESO, INGRESO o TRASPASO.');
    }

    // Construir datos de actualización
    const updateData: Record<string, unknown> = {};
    if (description !== undefined) updateData.description = description.trim();
    if (entryDate !== undefined) updateData.entryDate = new Date(entryDate + 'T12:00:00.000Z');
    if (entryType !== undefined) updateData.entryType = entryType;

    const updated = await db.journalEntry.update({
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
