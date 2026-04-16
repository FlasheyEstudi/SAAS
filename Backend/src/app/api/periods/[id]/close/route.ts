import { db } from '@/lib/db';
import { success, notFound, error, serverError } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================
// POST /api/periods/[id]/close - Close an accounting period
// Validates:
//   1. Period must be OPEN
//   2. No DRAFT journal entries in the period
//   3. Sets status to CLOSED, closedAt to now()
// ============================================================
export async function POST(_request: Request, context: RouteContext) {
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

    // Validate period is OPEN
    if (period.status !== 'OPEN') {
      return error(
        `Solo se pueden cerrar períodos en estado ABIERTO. ` +
        `El período ${period.year}-${String(period.month).padStart(2, '0')} está en estado ${period.status}.`
      );
    }

    // Validate no DRAFT journal entries
    const draftEntries = await db.journalEntry.count({
      where: { periodId: id, status: 'DRAFT' },
    });

    if (draftEntries > 0) {
      return error(
        `No se puede cerrar el período ${period.year}-${String(period.month).padStart(2, '0')}. ` +
        `Existen ${draftEntries} póliza(s) en estado BORRADOR. ` +
        'Todas las pólizas deben estar PUBLICADAS antes de cerrar el período.'
      );
    }

    // Close the period
    const closedPeriod = await db.accountingPeriod.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
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

    return success({
      message: `Período ${period.year}-${String(period.month).padStart(2, '0')} cerrado exitosamente`,
      period: closedPeriod,
    });
  } catch (err) {
    console.error('Error closing period:', err);
    return serverError('Error al cerrar el período contable');
  }
}
