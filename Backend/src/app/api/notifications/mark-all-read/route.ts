import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) return error('userId es obligatorio');

    const result = await db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return success({ markedAsRead: result.count });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    return serverError('Error al marcar todas las notificaciones como leídas');
  }
}
