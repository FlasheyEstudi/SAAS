import { db } from '@/lib/db';
import { success, created, error, parsePagination, serverError } from '@/lib/api-helpers';
import type { PaginatedResponse } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);
    const companyId = searchParams.get('companyId') || '';
    const year = searchParams.get('year');
    const accountId = searchParams.get('accountId') || '';
    const costCenterId = searchParams.get('costCenterId') || '';

    const where: Prisma.BudgetWhereInput = {};
    if (companyId) where.companyId = companyId;
    if (year) where.year = parseInt(year);
    if (accountId) where.accountId = accountId;
    if (costCenterId) where.costCenterId = costCenterId;

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

    return created(budget);
  } catch (err) {
    console.error('Error creating budget:', err);
    return serverError('Error al crear presupuesto');
  }
}
