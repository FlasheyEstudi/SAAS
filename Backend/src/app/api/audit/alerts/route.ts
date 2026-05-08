import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error, validateAuth, requireAuth } from '@/lib/api-helpers';

/**
 * GET /api/audit/alerts
 * Retorna logs de auditoría críticos para el Dashboard Forense.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    // Solo ADMIN y MANAGER pueden ver alertas forenses
    if (user!.role !== 'ADMIN' && user!.role !== 'MANAGER') {
      return error('No tiene permisos para ver alertas forenses', 403);
    }

    const { searchParams } = request.nextUrl;
    const companyId = searchParams.get('companyId') || user!.companyId;

    if (!companyId) {
      return error('No se pudo identificar la empresa para las alertas', 400);
    }

    // Definimos acciones críticas que requieren atención inmediata
    const criticalActions = ['DELETE', 'POST', 'CLOSE', 'IMPORT'];

    const alerts = await db.auditLog.findMany({
      where: {
        companyId: companyId as string,
        action: { in: criticalActions as any }
      },
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Enriquecer alertas con severidad
    const enrichedAlerts = alerts.map(log => {
      let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      
      if (log.action === 'DELETE') severity = 'HIGH';
      if (log.action === 'CLOSE') severity = 'MEDIUM';
      if (log.action === 'IMPORT') severity = 'MEDIUM';
      if (log.action === 'POST' && (log.newValues as any)?.totalDebit > 100000) severity = 'HIGH'; // Montos grandes

      return {
        ...log,
        severity
      };
    });

    return success(enrichedAlerts);

  } catch (err: any) {
    console.error('Error en Alertas Forenses:', err);
    return error('Error al obtener alertas de auditoría');
  }
}
