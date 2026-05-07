import { db } from '@/lib/db';
import { success, notFound, error, serverError, validateAuth, requireAuth, ensureNotViewer } from '@/lib/api-helpers';
import { logAudit } from '@/lib/audit-service';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================
// GET /api/periods/[id] - Get single period with journal entry count
// ============================================================
export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

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
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const roleError = ensureNotViewer(user!);
    if (roleError) return roleError;

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
    
    // Audit Log
    await logAudit({
      companyId: updatedPeriod.companyId,
      userId: user!.id,
      action: 'UPDATE',
      entityType: 'Period',
      entityId: updatedPeriod.id,
      entityLabel: `${updatedPeriod.year}-${updatedPeriod.month}`,
      oldValues: period,
      newValues: updatedPeriod,
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
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const roleError = ensureNotViewer(user!);
    if (roleError) return roleError;

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

    // Audit Log
    await logAudit({
      companyId: period.companyId,
      userId: user!.id,
      action: 'DELETE',
      entityType: 'Period',
      entityId: period.id,
      entityLabel: `${period.year}-${period.month}`,
      oldValues: period,
    });

    await db.accountingPeriod.delete({ where: { id } });

    return success({ deleted: true, id });
  } catch (err) {
    console.error('Error deleting period:', err);
    return serverError('Error al eliminar el período contable');
  }
}
