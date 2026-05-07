import { db } from '@/lib/db';

/**
 * Motor de Salud GANESHA
 * Realiza escaneos proactivos para alertar al usuario sobre inconsistencias o pendientes.
 */
export async function runCompanyHealthCheck(companyId: string) {
  const notifications: any[] = [];
  const today = new Date();

  // 1. Escanear Facturas Vencidas
  const overdueInvoices = await db.invoice.findMany({
    where: {
      companyId,
      status: { in: ['PENDING', 'PARTIAL'] },
      dueDate: { lt: today },
    },
    include: { thirdParty: true },
    take: 5,
  });

  for (const inv of overdueInvoices) {
    const days = Math.floor((today.getTime() - new Date(inv.dueDate!).getTime()) / (1000 * 3600 * 24));
    notifications.push({
      companyId,
      type: 'WARNING',
      title: 'Factura Vencida',
      message: `La factura ${inv.number} de ${inv.thirdParty.name} venció hace ${days} días. Saldo: C$ ${Number(inv.balanceDue).toLocaleString()}`,
      entityType: 'INVOICE',
      entityId: inv.id,
    });
  }

  // 2. Escanear Períodos Contables Olvidados (Abiertos por más de 45 días)
  const oldOpenPeriods = await db.accountingPeriod.findMany({
    where: {
      companyId,
      status: 'OPEN',
      createdAt: { lt: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000) },
    },
  });

  for (const p of oldOpenPeriods) {
    notifications.push({
      companyId,
      type: 'INFO',
      title: 'Cierre Sugerido',
      message: `El período ${p.month}/${p.year} sigue abierto. Considere realizar el cierre mensual para proteger los datos.`,
      entityType: 'PERIOD',
      entityId: p.id,
    });
  }

  // 3. Escanear Conciliaciones Pendientes
  const pendingMovements = await db.bankMovement.count({
    where: {
      bankAccount: { companyId },
      status: 'PENDING',
      movementDate: { lt: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000) },
    },
  });

  if (pendingMovements > 0) {
    notifications.push({
      companyId,
      type: 'INFO',
      title: 'Pendiente de Conciliación',
      message: `Tienes ${pendingMovements} movimientos bancarios antiguos sin conciliar.`,
      entityType: 'BANK_RECONCILIATION',
    });
  }
  
  // 4. Escanear Pólizas Descuadradas
  const imbalancedEntries = await db.journalEntry.findMany({
    where: {
      companyId,
      difference: { not: 0 },
    },
    select: { id: true, entryNumber: true, difference: true },
    take: 5,
  });

  for (const entry of imbalancedEntries) {
    notifications.push({
      companyId,
      type: 'URGENT',
      title: 'Póliza Descuadrada',
      message: `La póliza ${entry.entryNumber} tiene una diferencia de C$ ${Math.abs(Number(entry.difference)).toLocaleString()}. Requiere corrección inmediata.`,
      entityType: 'JOURNAL_ENTRY',
      entityId: entry.id,
    });
  }

  // Guardar notificaciones (Solo si no existen ya similares recientes para evitar spam)
  for (const n of notifications) {
    const exists = await db.notification.findFirst({
      where: {
        companyId: n.companyId,
        title: n.title,
        entityId: n.entityId,
        createdAt: { gte: new Date(today.getTime() - 24 * 60 * 60 * 1000) }, // No repetir en 24h
      },
    });

    if (!exists) {
      await db.notification.create({ data: n });
    }
  }

  return notifications.length;
}
