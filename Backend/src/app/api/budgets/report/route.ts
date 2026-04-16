import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const year = searchParams.get('year');
    const monthFrom = searchParams.get('monthFrom');
    const monthTo = searchParams.get('monthTo');

    if (!companyId || !year) return error('companyId y year son obligatorios');

    const budgets = await db.budget.findMany({
      where: { companyId, year: parseInt(year) },
      include: { account: { select: { code: true, name: true, accountType: true } } },
    });

    const startMonth = monthFrom ? parseInt(monthFrom) : 1;
    const endMonth = monthTo ? parseInt(monthTo) : 12;

    const filteredBudgets = budgets.filter(b => {
      if (b.month === 0) return true;
      return b.month >= startMonth && b.month <= endMonth;
    });

    const startDate = new Date(parseInt(year), startMonth - 1, 1);
    const endDate = new Date(parseInt(year), endMonth, 0, 23, 59, 59);

    const postedLines = await db.journalEntryLine.findMany({
      where: {
        journalEntry: { companyId, status: 'POSTED', entryDate: { gte: startDate, lte: endDate } },
      },
      include: { account: { select: { id: true, accountType: true } } },
    });

    const actualByAccount: Record<string, number> = {};
    for (const line of postedLines) {
      const type = line.account.accountType;
      const amount = type === 'ASSET' || type === 'EXPENSE'
        ? line.debit - line.credit
        : line.credit - line.debit;
      actualByAccount[line.accountId] = (actualByAccount[line.accountId] || 0) + amount;
    }

    const report = filteredBudgets.map(b => {
      const actual = actualByAccount[b.accountId] || 0;
      const budgeted = b.month === 0 ? b.budgetedAmount : b.budgetedAmount;
      const variance = actual - budgeted;
      const variancePercent = budgeted !== 0 ? Math.round((variance / budgeted) * 10000) / 100 : 0;

      return {
        id: b.id,
        accountCode: b.account.code,
        accountName: b.account.name,
        accountType: b.account.accountType,
        month: b.month,
        budgeted: Math.round(budgeted * 100) / 100,
        actual: Math.round(actual * 100) / 100,
        variance: Math.round(variance * 100) / 100,
        variancePercent,
      };
    });

    const totalBudgeted = report.reduce((s, r) => s + r.budgeted, 0);
    const totalActual = report.reduce((s, r) => s + r.actual, 0);

    return success({
      year: parseInt(year),
      monthRange: { from: startMonth, to: endMonth },
      summary: {
        totalBudgeted: Math.round(totalBudgeted * 100) / 100,
        totalActual: Math.round(totalActual * 100) / 100,
        totalVariance: Math.round((totalActual - totalBudgeted) * 100) / 100,
      },
      details: report,
    });
  } catch (err) {
    console.error('Error generating budget report:', err);
    return serverError('Error al generar reporte presupuestal');
  }
}
