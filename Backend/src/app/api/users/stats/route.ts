import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    if (!companyId) return error('companyId es obligatorio');

    const [total, active, byRole] = await Promise.all([
      db.user.count({ where: { companyId } }),
      db.user.count({ where: { companyId, isActive: true } }),
      db.user.groupBy({
        by: ['role'],
        where: { companyId },
        _count: { role: true },
      }),
    ]);

    const roleCounts: Record<string, number> = {};
    for (const r of byRole) {
      roleCounts[r.role] = r._count.role;
    }

    return success({
      companyId,
      totalUsers: total,
      activeUsers: active,
      inactiveUsers: total - active,
      byRole: roleCounts,
    });
  } catch (err) {
    console.error('Error fetching user stats:', err);
    return serverError('Error al obtener estadísticas de usuarios');
  }
}
