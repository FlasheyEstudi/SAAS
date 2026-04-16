import { db } from '@/lib/db';
import { success, notFound, error, serverError } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const rate = await db.exchangeRate.findUnique({ where: { id } });
    if (!rate) return notFound('Tipo de cambio no encontrado');
    return success(rate);
  } catch (err) {
    console.error('Error fetching exchange rate:', err);
    return serverError('Error al obtener tipo de cambio');
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { rate, source } = body;

    const existing = await db.exchangeRate.findUnique({ where: { id } });
    if (!existing) return notFound('Tipo de cambio no encontrado');

    if (rate !== undefined && rate <= 0) return error('El tipo de cambio debe ser mayor a 0');

    const updated = await db.exchangeRate.update({
      where: { id },
      data: {
        ...(rate !== undefined ? { rate: parseFloat(rate) } : {}),
        ...(source !== undefined ? { source } : {}),
      },
    });
    return success(updated);
  } catch (err) {
    console.error('Error updating exchange rate:', err);
    return serverError('Error al actualizar tipo de cambio');
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const existing = await db.exchangeRate.findUnique({ where: { id } });
    if (!existing) return notFound('Tipo de cambio no encontrado');

    await db.exchangeRate.delete({ where: { id } });
    return success({ deleted: true, id });
  } catch (err) {
    console.error('Error deleting exchange rate:', err);
    return serverError('Error al eliminar tipo de cambio');
  }
}
