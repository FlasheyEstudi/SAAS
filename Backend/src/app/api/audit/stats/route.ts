import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    if (!companyId) return error('companyId es obligatorio');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [byAction, byUser, byDay] = await Promise.all([
      db.auditLog.groupBy({
        by: ['action'],
        where: { companyId },
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
      }),
      db.auditLog.groupBy({
        by: ['userId'],
        where: { companyId },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
      db.auditLog.groupBy({
        by: ['createdAt'],
        where: { companyId, createdAt: { gte: thirtyDaysAgo } },
        _count: { createdAt: true },
      }),
    ]);

    const dayCounts: Record<string, number> = {};
    for (const d of byDay) {
      const key = d.createdAt.toISOString().split('T')[0];
      dayCounts[key] = (dayCounts[key] || 0) + d._count.createdAt;
    }

    const actionCounts: Record<string, number> = {};
    for (const a of byAction) {
      actionCounts[a.action] = a._count.action;
    }

    const userIds = byUser.map(u => u.userId).filter(Boolean) as string[];
    const users = userIds.length > 0
      ? await db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
      : [];
    const userMap: Record<string, string> = {};
    for (const u of users) userMap[u.id] = u.name;

    const userCounts = byUser.map(u => ({
      userId: u.userId,
      userName: u.userId ? userMap[u.userId] || 'Unknown' : 'System',
      count: u._count.userId,
    }));

    return success({
      totalActions: Object.values(actionCounts).reduce((s, v) => s + v, 0),
      byAction: actionCounts,
      byUser: userCounts,
      byDayLast30: dayCounts,
    });
  } catch (err) {
    console.error('Error fetching audit stats:', err);
    return serverError('Error al obtener estadísticas de auditoría');
  }
}
