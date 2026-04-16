import { db } from '@/lib/db';
import { success, notFound, error, serverError } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const budget = await db.budget.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, code: true, name: true, accountType: true } },
        costCenter: { select: { id: true, code: true, name: true } },
      },
    });
    if (!budget) return notFound('Presupuesto no encontrado');
    return success(budget);
  } catch (err) {
    console.error('Error fetching budget:', err);
    return serverError('Error al obtener presupuesto');
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { budgetedAmount, description, month, costCenterId } = body;

    const existing = await db.budget.findUnique({ where: { id } });
    if (!existing) return notFound('Presupuesto no encontrado');

    const budget = await db.budget.update({
      where: { id },
      data: {
        ...(budgetedAmount !== undefined ? { budgetedAmount: parseFloat(budgetedAmount) } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(month !== undefined ? { month: parseInt(month) } : {}),
        ...(costCenterId !== undefined ? { costCenterId: costCenterId || null } : {}),
      },
      include: {
        account: { select: { id: true, code: true, name: true, accountType: true } },
      },
    });
    return success(budget);
  } catch (err) {
    console.error('Error updating budget:', err);
    return serverError('Error al actualizar presupuesto');
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const budget = await db.budget.findUnique({ where: { id } });
    if (!budget) return notFound('Presupuesto no encontrado');

    await db.budget.delete({ where: { id } });
    return success({ deleted: true, id });
  } catch (err) {
    console.error('Error deleting budget:', err);
    return serverError('Error al eliminar presupuesto');
  }
}
