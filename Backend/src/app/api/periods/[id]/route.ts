import { db } from '@/lib/db';
import { success, notFound, error, serverError } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================
// GET /api/periods/[id] - Get single period with journal entry count
// ============================================================
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const period = await db.accountingPeriod.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true, taxId: true },
        },
        _count: {
          select: { journalEntries: true },
        },
      },
    });

    if (!period) {
      return notFound('Período contable no encontrado');
    }

    return success(period);
  } catch (err) {
    console.error('Error fetching period:', err);
    return serverError('Error al obtener el período contable');
  }
}

// ============================================================
// PUT /api/periods/[id] - Update period status
// Status flow: OPEN -> CLOSED -> LOCKED
// When closing, validates no DRAFT journal entries exist
// ============================================================
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return error('El campo status es obligatorio');
    }

    const validStatuses = ['OPEN', 'CLOSED', 'LOCKED'];
    if (!validStatuses.includes(status)) {
      return error(`El estado debe ser uno de: ${validStatuses.join(', ')}`);
    }

    const period = await db.accountingPeriod.findUnique({
      where: { id },
      include: {
        _count: { select: { journalEntries: true } },
      },
    });

    if (!period) {
      return notFound('Período contable no encontrado');
    }

    // Validate status transition
    const statusFlow: Record<string, string[]> = {
      OPEN: ['CLOSED'],
      CLOSED: ['LOCKED', 'OPEN'], // Allow reopening from CLOSED
      LOCKED: ['CLOSED', 'OPEN'], // Allow reopening from LOCKED
    };

    const allowedTransitions = statusFlow[period.status];
    if (!allowedTransitions || !allowedTransitions.includes(status)) {
      return error(
        `Transición de estado no permitida: ${period.status} -> ${status}. ` +
        `Flujos válidos: OPEN->CLOSED->LOCKED. Se permite reabrir desde CLOSED/LOCKED.`
      );
    }

    // When closing, validate no DRAFT journal entries exist
    if (status === 'CLOSED') {
      const draftEntries = await db.journalEntry.count({
        where: { periodId: id, status: 'DRAFT' },
      });
      if (draftEntries > 0) {
        return error(
          `No se puede cerrar el período. Existen ${draftEntries} póliza(s) en estado BORRADOR. ` +
          'Todas las pólizas deben estar PUBLICADAS antes de cerrar.'
        );
      }
    }

    const updatedPeriod = await db.accountingPeriod.update({
      where: { id },
      data: {
        status,
        closedAt: status === 'CLOSED' ? new Date() : (status === 'OPEN' ? null : undefined),
      },
      include: {
        company: {
          select: { id: true, name: true, taxId: true },
        },
        _count: {
          select: { journalEntries: true },
        },
      },
    });

    return success(updatedPeriod);
  } catch (err) {
    console.error('Error updating period:', err);
    return serverError('Error al actualizar el período contable');
  }
}

// ============================================================
// DELETE /api/periods/[id] - Delete only OPEN periods with no journal entries
// ============================================================
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const period = await db.accountingPeriod.findUnique({
      where: { id },
      include: {
        _count: { select: { journalEntries: true } },
      },
    });

    if (!period) {
      return notFound('Período contable no encontrado');
    }

    if (period.status !== 'OPEN') {
      return error(
        `Solo se pueden eliminar períodos en estado ABIERTO. El período actual está en estado ${period.status}.`
      );
    }

    if (period._count.journalEntries > 0) {
      return error(
        `No se puede eliminar el período. Tiene ${period._count.journalEntries} póliza(s) asociada(s).`
      );
    }

    await db.accountingPeriod.delete({ where: { id } });

    return success({ deleted: true, id });
  } catch (err) {
    console.error('Error deleting period:', err);
    return serverError('Error al eliminar el período contable');
  }
}
