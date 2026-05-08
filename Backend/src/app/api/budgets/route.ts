import { db } from '@/lib/db';
import { success, created, error, parsePagination, serverError, validateAuth } from '@/lib/api-helpers';
import type { PaginatedResponse } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';
import { logAudit } from '@/lib/audit-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);
    const companyId = searchParams.get('companyId') || '';
    const year = searchParams.get('year');
    const accountId = searchParams.get('accountId') || '';
    const costCenterId = searchParams.get('costCenterId') || '';
    const shouldSync = searchParams.get('sync') === 'true';

    const where: Prisma.BudgetWhereInput = {};
    if (companyId) where.companyId = companyId;
    if (year) where.year = parseInt(year);
    if (accountId) where.accountId = accountId;
    if (costCenterId) where.costCenterId = costCenterId;

    // 1. Sincronización bajo demanda (Fase 2 - Auditoría M5)
    if (shouldSync && companyId) {
      const budgetsToSync = await db.budget.findMany({ 
        where,
        include: { account: { select: { accountType: true } } }
      });
      
      for (const b of budgetsToSync) {
        // Calcular ejecución real desde el Ledger
        const dateFrom = new Date(b.year, b.month ? b.month - 1 : 0, 1);
        const dateTo = new Date(b.year, b.month ? b.month : 12, 0, 23, 59, 59);

        const lines = await db.journalEntryLine.aggregate({
          where: {
            accountId: b.accountId,
            journalEntry: {
              companyId: b.companyId,
              status: 'POSTED',
              entryDate: { gte: dateFrom, lte: dateTo }
            }
          },
          _sum: { debit: true, credit: true }
        });

        const debit = Number(lines._sum.debit || 0);
        const credit = Number(lines._sum.credit || 0);
        
        // Naturaleza de la cuenta (Audit M5)
        // Gastos: Debe - Haber
        // Ingresos: Haber - Debe
        const isExpense = b.account.accountType === 'EXPENSE';
        const actualAmount = isExpense ? (debit - credit) : (credit - debit);
        
        // Varianza: Presupuestado - Real (para gastos, >0 es ahorro)
        // Para ingresos: Real - Presupuestado (>0 es sobre-cumplimiento)
        const variance = isExpense ? (Number(b.budgetedAmount) - actualAmount) : (actualAmount - Number(b.budgetedAmount));

        await db.budget.update({
          where: { id: b.id },
          data: { 
            actualAmount: actualAmount,
            variance: variance
          }
        });
      }
    }

    const [budgets, total] = await Promise.all([
      db.budget.findMany({
        where,
        include: {
          account: { select: { id: true, code: true, name: true, accountType: true } },
          costCenter: { select: { id: true, code: true, name: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.budget.count({ where }),
    ]);

    const result: PaginatedResponse<typeof budgets[0]> = {
      data: budgets,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    };
    return success(result);
  } catch (err) {
    console.error('Error listing budgets:', err);
    return serverError('Error al listar presupuestos');
  }
}

export async function POST(request: Request) {
  try {
    const user = await validateAuth(request);
    const body = await request.json();
    const { companyId, year, month, accountId, costCenterId, budgetedAmount, description } = body;

    if (!companyId || !year || !accountId || budgetedAmount === undefined) {
      return error('companyId, year, accountId y budgetedAmount son obligatorios');
    }

    const account = await db.account.findUnique({ where: { id: accountId } });
    if (!account) return error('Cuenta contable no encontrada');

    const budget = await db.budget.create({
      data: {
        companyId,
        year: parseInt(year),
        month: month !== undefined ? parseInt(month) : 0,
        accountId,
        costCenterId: costCenterId || null,
        budgetedAmount: parseFloat(budgetedAmount),
        description: description || null,
      },
      include: {
        account: { select: { id: true, code: true, name: true, accountType: true } },
      },
    });

    // Audit Log
    await logAudit({
      companyId,
      userId: user?.id || null,
      action: 'CREATE',
      entityType: 'BUDGET',
      entityId: budget.id,
      entityLabel: `Presupuesto ${budget.year} - ${budget.account.code}`,
      newValues: budget,
    });

    return created(budget);
  } catch (err) {
    console.error('Error creating budget:', err);
    return serverError('Error al crear presupuesto');
  }
}
