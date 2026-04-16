import { db } from '@/lib/db';
import { success, notFound, serverError } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const log = await db.auditLog.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!log) return notFound('Registro de auditoría no encontrado');
    return success(log);
  } catch (err) {
    console.error('Error fetching audit log:', err);
    return serverError('Error al obtener registro de auditoría');
  }
}
