import { db } from '@/lib/db';
import { success, error, serverError, created } from '@/lib/api-helpers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, year, month, items } = body;

    if (!companyId || !year || !items || !Array.isArray(items)) {
      return error('companyId, year y items (array) son obligatorios');
    }

    const results = [];
    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    await db.$transaction(async (tx) => {
      for (const item of items) {
        if (!item.accountId || item.budgetedAmount === undefined) {
          errorCount++;
          continue;
        }

        const monthVal = month !== undefined ? parseInt(month) : (item.month !== undefined ? parseInt(item.month) : 0);

        const existing = await tx.budget.findFirst({
          where: {
            companyId,
            year: parseInt(year),
            month: monthVal,
            accountId: item.accountId,
            costCenterId: item.costCenterId || null,
          },
        });

        if (existing) {
          await tx.budget.update({
            where: { id: existing.id },
            data: { budgetedAmount: parseFloat(item.budgetedAmount), description: item.description || existing.description },
          });
          updatedCount++;
          results.push({ id: existing.id, action: 'updated' });
        } else {
          const budget = await tx.budget.create({
            data: {
              companyId,
              year: parseInt(year),
              month: monthVal,
              accountId: item.accountId,
              costCenterId: item.costCenterId || null,
              budgetedAmount: parseFloat(item.budgetedAmount),
              description: item.description || null,
            },
          });
          createdCount++;
          results.push({ id: budget.id, action: 'created' });
        }
      }
    });

    return created({
      processed: items.length,
      created: createdCount,
      updated: updatedCount,
      errors: errorCount,
      results,
    });
  } catch (err) {
    console.error('Error bulk creating budgets:', err);
    return serverError('Error al crear presupuestos en lote');
  }
}
