import { db } from '@/lib/db';
import { success, notFound, error, serverError, validateAuth, requireAuth, ensureNotViewer } from '@/lib/api-helpers';
import { logAudit } from '@/lib/audit-service';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================
// GET /api/bank-accounts/[id] - Get bank account with movement summary
// ============================================================
export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const { id } = await context.params;

    const bankAccount = await db.bankAccount.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, currency: true } },
      },
    });

    if (!bankAccount) {
      return notFound('Cuenta bancaria no encontrada');
    }

    // Get movement summary
    const [totalMovements, reconciledCount, pendingCount, excludedCount] = await Promise.all([
      db.bankMovement.count({ where: { bankAccountId: id } }),
      db.bankMovement.count({ where: { bankAccountId: id, status: 'RECONCILED' } }),
      db.bankMovement.count({ where: { bankAccountId: id, status: 'PENDING' } }),
      db.bankMovement.count({ where: { bankAccountId: id, status: 'EXCLUDED' } }),
    ]);

    // Get latest movements (last 10)
    const recentMovements = await db.bankMovement.findMany({
      where: { bankAccountId: id },
      orderBy: { movementDate: 'desc' },
      take: 10,
    });

    return success({
      ...bankAccount,
      movementSummary: {
        total: totalMovements,
        reconciled: reconciledCount,
        pending: pendingCount,
        excluded: excludedCount,
      },
      recentMovements,
    });
  } catch (err) {
    console.error('Error fetching bank account:', err);
    return serverError('Error al obtener la cuenta bancaria');
  }
}

// ============================================================
// PUT /api/bank-accounts/[id] - Update bank account
// ============================================================
export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const roleError = ensureNotViewer(user!);
    if (roleError) return roleError;

    const { id } = await context.params;
    const body = await request.json();
    const { bankName, accountNumber, accountType, currency, initialBalance, isActive } = body;

    const existing = await db.bankAccount.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Cuenta bancaria no encontrada');
    }

    // Validate accountType if provided
    const validTypes = ['CHECKING', 'SAVINGS', 'INVESTMENT'];
    if (accountType && !validTypes.includes(accountType)) {
      return error('El tipo de cuenta debe ser CHECKING, SAVINGS o INVESTMENT');
    }

    // Check account number uniqueness if changing
    if (accountNumber && accountNumber.trim() !== existing.accountNumber) {
      const duplicate = await db.bankAccount.findFirst({
        where: { companyId: existing.companyId, accountNumber: accountNumber.trim() },
      });
      if (duplicate) {
        return error('Ya existe una cuenta bancaria con ese número para esta empresa');
      }
    }

    const bankAccount = await db.bankAccount.update({
      where: { id },
      data: {
        ...(bankName !== undefined ? { bankName: bankName.trim() } : {}),
        ...(accountNumber !== undefined ? { accountNumber: accountNumber.trim() } : {}),
        ...(accountType !== undefined ? { accountType } : {}),
        ...(currency !== undefined ? { currency } : {}),
        ...(initialBalance !== undefined ? { initialBalance } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: {
        company: { select: { id: true, name: true } },
      },
    });

    // Audit Log
    await logAudit({
      companyId: bankAccount.companyId,
      userId: user!.id,
      action: 'UPDATE',
      entityType: 'BankAccount',
      entityId: bankAccount.id,
      entityLabel: `${bankAccount.bankName} - ${bankAccount.accountNumber}`,
      oldValues: existing,
      newValues: bankAccount,
    });

    return success(bankAccount);
  } catch (err) {
    console.error('Error updating bank account:', err);
    return serverError('Error al actualizar la cuenta bancaria');
  }
}

// ============================================================
// DELETE /api/bank-accounts/[id] - Delete only if no PENDING movements
// ============================================================
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const roleError = ensureNotViewer(user!);
    if (roleError) return roleError;

    const { id } = await context.params;

    const bankAccount = await db.bankAccount.findUnique({
      where: { id },
    });

    if (!bankAccount) {
      return notFound('Cuenta bancaria no encontrada');
    }

    // Check for PENDING movements
    const pendingCount = await db.bankMovement.count({
      where: { bankAccountId: id, status: 'PENDING' },
    });

    if (pendingCount > 0) {
      return error(`No se puede eliminar la cuenta bancaria. Tiene ${pendingCount} movimiento(s) pendiente(s) de conciliar.`);
    }

    // Audit Log
    await logAudit({
      companyId: bankAccount.companyId,
      userId: user!.id,
      action: 'DELETE',
      entityType: 'BankAccount',
      entityId: bankAccount.id,
      entityLabel: `${bankAccount.bankName} - ${bankAccount.accountNumber}`,
      oldValues: bankAccount,
    });

    await db.bankAccount.delete({ where: { id } });

    return success({ deleted: true, id });
  } catch (err) {
    console.error('Error deleting bank account:', err);
    return serverError('Error al eliminar la cuenta bancaria');
  }
}
