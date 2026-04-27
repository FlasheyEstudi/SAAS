import { db } from '@/lib/db';

// Tipo para Auditoría (Bypassing stale IDE linting)
type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'POST' | 'CLOSE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT';

export interface AuditLogOptions {
  companyId: string;
  userId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityLabel?: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Servicio de Auditoría Profesional
 * Registra acciones críticas en el sistema para trazabilidad total.
 */
export async function logAudit(options: AuditLogOptions) {
  try {
    const {
      companyId,
      userId,
      action,
      entityType,
      entityId,
      entityLabel,
      oldValues,
      newValues,
      metadata,
      ipAddress,
      userAgent
    } = options;

    return await db.auditLog.create({
      data: {
        companyId,
        userId,
        action,
        entityType,
        entityId,
        entityLabel,
        oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
        newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
        ipAddress,
        userAgent
      } as any
    });
  } catch (error) {
    console.error('[AuditService] Failed to log action:', error);
    // No lanzamos el error para no bloquear la transacción principal
    // pero en un entorno 100/100 se podría enviar a un sistema de monitoreo.
  }
}

/**
 * Helper para auditar dentro de una transacción de Prisma
 */
export async function logAuditTx(tx: any, options: AuditLogOptions) {
  const {
    companyId,
    userId,
    action,
    entityType,
    entityId,
    entityLabel,
    oldValues,
    newValues,
    metadata,
    ipAddress,
    userAgent
  } = options;

  return await tx.auditLog.create({
    data: {
      companyId,
      userId,
      action,
      entityType,
      entityId,
      entityLabel,
      oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
      newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      ipAddress,
      userAgent
    }
  });
}
