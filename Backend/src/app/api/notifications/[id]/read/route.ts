import { db } from '@/lib/db';
import { success, notFound, serverError } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const existing = await db.notification.findUnique({ where: { id } });
    if (!existing) return notFound('Notificación no encontrada');

    const notification = await db.notification.update({
      where: { id },
      data: { isRead: true },
    });

    // --- BLINDAJE FORENSE: REGISTRAR EN AUDITORÍA ---
    try {
      await db.auditLog.create({
        data: {
          companyId: notification.companyId,
          userId: existing.userId || '', 
          action: 'UPDATE',
          entityType: 'NOTIFICATION',
          entityId: notification.id,
          entityLabel: notification.title,
          metadata: { description: `El usuario atendió el protocolo: ${notification.title}` },
        },
      });
    } catch (auditErr) {
      console.warn('Error generating forensic audit for notification:', auditErr);
    }

    return success(notification);
  } catch (err) {
    console.error('Error marking notification as read:', err);
    return serverError('Error al marcar notificación como leída');
  }
}
