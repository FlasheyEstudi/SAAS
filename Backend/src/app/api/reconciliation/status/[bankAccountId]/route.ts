import { db } from '@/lib/db';
import { success, notFound, serverError } from '@/lib/api-helpers';

// ============================================================
// GET /api/reconciliation/status/[bankAccountId] - Estado de conciliación
//
// Devuelve el estado completo de conciliación de una cuenta bancaria:
// - Total de movimientos
// - Conciliados (RECONCILED)
// - Pendientes (PENDING)
// - Excluidos (EXCLUDED)
// - Montos totales por estado
// - Último movimiento conciliado
// - Porcentaje de conciliación
// ============================================================

function roundTwo(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bankAccountId: string }> }
) {
  try {
    const { bankAccountId } = await params;

    // Validar que la cuenta bancaria existe
    const bankAccount = await db.bankAccount.findUnique({
      where: { id: bankAccountId },
    });

    if (!bankAccount) {
      return notFound('Cuenta bancaria no encontrada');
    }

    // Obtener contadores por estado
    const [totalCount, statusGroups] = await Promise.all([
      db.bankMovement.count({ where: { bankAccountId } }),
      db.bankMovement.groupBy({
        by: ['status'],
        where: { bankAccountId },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    // Extraer contadores por estado
    let reconciledCount = 0;
    let reconciledAmount = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    let excludedCount = 0;
    let excludedAmount = 0;

    for (const group of statusGroups) {
      const amount = roundTwo(group._sum.amount ?? 0);
      switch (group.status) {
        case 'RECONCILED':
          reconciledCount = group._count.id;
          reconciledAmount = amount;
          break;
        case 'PENDING':
          pendingCount = group._count.id;
          pendingAmount = amount;
          break;
        case 'EXCLUDED':
          excludedCount = group._count.id;
          excludedAmount = amount;
          break;
      }
    }

    // Último movimiento conciliado
    const lastReconciled = await db.bankMovement.findFirst({
      where: { bankAccountId, status: 'RECONCILED' },
      orderBy: { movementDate: 'desc' },
      select: {
        id: true,
        description: true,
        movementDate: true,
        amount: true,
        movementType: true,
        reference: true,
        updatedAt: true,
      },
    });

    // Primer movimiento pendiente (más antiguo)
    const oldestPending = await db.bankMovement.findFirst({
      where: { bankAccountId, status: 'PENDING' },
      orderBy: { movementDate: 'asc' },
      select: {
        id: true,
        description: true,
        movementDate: true,
        amount: true,
        movementType: true,
      },
    });

    // Desglose por tipo de movimiento (débitos y créditos)
    const movementTypeGroups = await db.bankMovement.groupBy({
      by: ['movementType'],
      where: { bankAccountId, status: 'PENDING' },
      _sum: { amount: true },
      _count: { id: true },
    });

    let pendingDebits = 0;
    let pendingCredits = 0;
    for (const group of movementTypeGroups) {
      if (group.movementType === 'DEBIT') {
        pendingDebits = roundTwo(group._sum.amount ?? 0);
      } else if (group.movementType === 'CREDIT') {
        pendingCredits = roundTwo(group._sum.amount ?? 0);
      }
    }

    // Porcentaje de conciliación
    const reconciliationRate = totalCount > 0
      ? Math.round((reconciledCount / totalCount) * 100)
      : 100; // Si no hay movimientos, está 100% conciliado

    // Determinar nivel de alerta
    let alertLevel: 'OK' | 'WARNING' | 'CRITICAL';
    if (reconciliationRate >= 90) {
      alertLevel = 'OK';
    } else if (reconciliationRate >= 50) {
      alertLevel = 'WARNING';
    } else {
      alertLevel = 'CRITICAL';
    }

    return success({
      bankAccount: {
        id: bankAccount.id,
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
        accountType: bankAccount.accountType,
        currency: bankAccount.currency,
        currentBalance: bankAccount.currentBalance,
      },
      counts: {
        total: totalCount,
        reconciled: reconciledCount,
        pending: pendingCount,
        excluded: excludedCount,
      },
      amounts: {
        total: roundTwo(reconciledAmount + pendingAmount + excludedAmount),
        reconciled: reconciledAmount,
        pending: pendingAmount,
        excluded: excludedAmount,
        pendingNet: roundTwo(pendingCredits - pendingDebits),
        pendingDebits,
        pendingCredits,
      },
      progress: {
        reconciliationRate,
        alertLevel,
        remainingToReconcile: pendingCount,
      },
      lastReconciled,
      oldestPending,
    });
  } catch (err) {
    console.error('Error al obtener estado de conciliación:', err);
    return serverError('Error al obtener el estado de conciliación');
  }
}
