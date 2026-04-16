import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const companyId = searchParams.get('companyId');

    if (!userId && !companyId) return error('userId o companyId es obligatorio');

    const where: Record<string, unknown> = { isRead: false };
    if (userId) where.userId = userId;
    if (companyId) where.companyId = companyId;

    const count = await db.notification.count({ where });

    return success({ count, unread: true });
  } catch (err) {
    console.error('Error counting unread notifications:', err);
    return serverError('Error al contar notificaciones no leídas');
  }
}
