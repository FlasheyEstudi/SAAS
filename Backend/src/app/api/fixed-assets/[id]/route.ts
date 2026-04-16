import { db } from '@/lib/db';
import { success, notFound, error, serverError } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const asset = await db.fixedAsset.findUnique({
      where: { id },
      include: { _count: { select: { depreciations: true } } },
    });
    if (!asset) return notFound('Activo fijo no encontrado');
    return success(asset);
  } catch (err) {
    console.error('Error fetching fixed asset:', err);
    return serverError('Error al obtener activo fijo');
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name, description, location, status } = body;

    const existing = await db.fixedAsset.findUnique({ where: { id } });
    if (!existing) return notFound('Activo fijo no encontrado');

    const validStatuses = ['ACTIVE', 'DISPOSED', 'SOLD', 'FULLY_DEPRECIATED'];
    if (status && !validStatuses.includes(status)) return error('status inválido');

    const asset = await db.fixedAsset.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(location !== undefined ? { location } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });
    return success(asset);
  } catch (err) {
    console.error('Error updating fixed asset:', err);
    return serverError('Error al actualizar activo fijo');
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const asset = await db.fixedAsset.findUnique({
      where: { id },
      include: { _count: { select: { depreciations: true } } },
    });
    if (!asset) return notFound('Activo fijo no encontrado');
    if (asset.status !== 'ACTIVE') return error('Solo se pueden eliminar activos en estado ACTIVE');
    if (asset._count.depreciations > 0) return error('No se puede eliminar un activo con depreciaciones registradas');

    await db.fixedAsset.delete({ where: { id } });
    return success({ deleted: true, id });
  } catch (err) {
    console.error('Error deleting fixed asset:', err);
    return serverError('Error al eliminar activo fijo');
  }
}
