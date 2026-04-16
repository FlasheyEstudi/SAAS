import { db } from '@/lib/db';
import { success, notFound, parsePagination, serverError } from '@/lib/api-helpers';
import type { PaginatedResponse } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);

    const user = await db.user.findUnique({ where: { id } });
    if (!user) return notFound('Usuario no encontrado');

    const where = { userId: id };

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ]);

    const result: PaginatedResponse<typeof logs[0]> = {
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    };

    return success(result);
  } catch (err) {
    console.error('Error fetching user activity:', err);
    return serverError('Error al obtener actividad del usuario');
  }
}
