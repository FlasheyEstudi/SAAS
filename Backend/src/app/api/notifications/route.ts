import { db } from '@/lib/db';
import { success, created, error, parsePagination, serverError } from '@/lib/api-helpers';
import type { PaginatedResponse } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);
    const companyId = searchParams.get('companyId') || '';
    const userId = searchParams.get('userId') || '';
    const type = searchParams.get('type') || '';
    const isRead = searchParams.get('isRead');

    const where: Prisma.NotificationWhereInput = {};
    if (companyId) where.companyId = companyId;
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (isRead !== null && isRead !== '') where.isRead = isRead === 'true';

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({ where }),
    ]);

    const result: PaginatedResponse<typeof notifications[0]> = {
      data: notifications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    };
    return success(result);
  } catch (err) {
    console.error('Error listing notifications:', err);
    return serverError('Error al listar notificaciones');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, userId, type, title, message, link } = body;

    if (!companyId || !type || !title || !message) {
      return error('companyId, type, title y message son obligatorios');
    }

    const validTypes = ['INFO', 'WARNING', 'ERROR', 'SUCCESS'];
    if (!validTypes.includes(type)) return error('type inválido. Use INFO, WARNING, ERROR o SUCCESS');

    const notification = await db.notification.create({
      data: { companyId, userId: userId || null, type, title, message, link: link || null },
    });

    return created(notification);
  } catch (err) {
    console.error('Error creating notification:', err);
    return serverError('Error al crear notificación');
  }
}
