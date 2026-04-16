import { db } from '@/lib/db';
import { success, notFound, error, serverError } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const notification = await db.notification.findUnique({ where: { id } });
    if (!notification) return notFound('Notificación no encontrada');
    return success(notification);
  } catch (err) {
    console.error('Error fetching notification:', err);
    return serverError('Error al obtener notificación');
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { isRead } = body;

    const existing = await db.notification.findUnique({ where: { id } });
    if (!existing) return notFound('Notificación no encontrada');

    const notification = await db.notification.update({
      where: { id },
      data: {
        ...(isRead !== undefined ? { isRead } : {}),
      },
    });
    return success(notification);
  } catch (err) {
    console.error('Error updating notification:', err);
    return serverError('Error al actualizar notificación');
  }
}
