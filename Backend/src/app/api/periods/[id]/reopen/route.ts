import { db } from '@/lib/db';
import { success, notFound, error, serverError } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================
// POST /api/periods/[id]/reopen - Reopen a CLOSED or LOCKED period
// Sets status back to OPEN and resets closedAt
// ============================================================
export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const period = await db.accountingPeriod.findUnique({
      where: { id },
    });

    if (!period) {
      return notFound('Período contable no encontrado');
    }

    if (period.status === 'OPEN') {
      return error('El período ya se encuentra ABIERTO');
    }

    // Reopen the period
    const reopenedPeriod = await db.accountingPeriod.update({
      where: { id },
      data: {
        status: 'OPEN',
        closedAt: null,
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
      message: `Período ${period.year}-${String(period.month).padStart(2, '0')} reabierto exitosamente`,
      period: reopenedPeriod,
    });
  } catch (err) {
    console.error('Error reopening period:', err);
    return serverError('Error al reabrir el período contable');
  }
}
