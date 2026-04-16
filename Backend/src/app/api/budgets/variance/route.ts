import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const year = searchParams.get('year');
    const monthFrom = searchParams.get('monthFrom');
    const monthTo = searchParams.get('monthTo');
    const topN = parseInt(searchParams.get('topN') || '10');

    if (!companyId || !year) return error('companyId y year son obligatorios');

    const startMonth = monthFrom ? parseInt(monthFrom) : 1;
    const endMonth = monthTo ? parseInt(monthTo) : 12;

    const budgets = await db.budget.findMany({
      where: { companyId, year: parseInt(year) },
      include: { account: { select: { code: true, name: true, accountType: true } } },
    });

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

    const variances = filteredBudgets.map(b => {
      const actual = actualByAccount[b.accountId] || 0;
      const variance = actual - b.budgetedAmount;
      const variancePercent = b.budgetedAmount !== 0 ? (variance / b.budgetedAmount) * 100 : 0;
      return {
        id: b.id,
        accountCode: b.account.code,
        accountName: b.account.name,
        accountType: b.account.accountType,
        budgeted: Math.round(b.budgetedAmount * 100) / 100,
        actual: Math.round(actual * 100) / 100,
        variance: Math.round(variance * 100) / 100,
        variancePercent: Math.round(variancePercent * 100) / 100,
        direction: variance > 0 ? 'OVER' : variance < 0 ? 'UNDER' : 'ON_TARGET',
      };
    });

    const sorted = variances.sort((a, b) => Math.abs(b.variancePercent) - Math.abs(a.variancePercent));
    const overBudget = sorted.filter(v => v.direction === 'OVER').slice(0, topN);
    const underBudget = sorted.filter(v => v.direction === 'UNDER').slice(0, topN);

    return success({
      year: parseInt(year),
      monthRange: { from: startMonth, to: endMonth },
      topOverBudget: overBudget,
      topUnderBudget: underBudget,
      totalVarianceItems: variances.length,
    });
  } catch (err) {
    console.error('Error calculating budget variance:', err);
    return serverError('Error al calcular variaciones presupuestales');
  }
}
