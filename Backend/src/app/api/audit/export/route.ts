import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (!companyId) return error('companyId es obligatorio');

    const where: Prisma.AuditLogWhereInput = { companyId };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Prisma.DateTimeNullableFilter).gte = new Date(dateFrom);
      if (dateTo) (where.createdAt as Prisma.DateTimeNullableFilter).lte = new Date(dateTo);
    }

    const logs = await db.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
      take: 10000,
    });

    const exportData = logs.map(l => ({
      id: l.id,
      companyId: l.companyId,
      userId: l.userId,
      userName: l.user?.name || null,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      entityLabel: l.entityLabel,
      details: l.details ? JSON.parse(l.details) : null,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt.toISOString(),
    }));

    return success({
      exportDate: new Date().toISOString(),
      totalRecords: exportData.length,
      filters: { companyId, dateFrom: dateFrom || null, dateTo: dateTo || null },
      data: exportData,
    });
  } catch (err) {
    console.error('Error exporting audit logs:', err);
    return serverError('Error al exportar registros de auditoría');
  }
}
