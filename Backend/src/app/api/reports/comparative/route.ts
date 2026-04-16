import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const periodAId = searchParams.get('periodAId');
    const periodBId = searchParams.get('periodBId');
    const yearA = searchParams.get('yearA');
    const yearB = searchParams.get('yearB');
    const reportType = searchParams.get('reportType') || 'BALANCE_SHEET';

    if (!companyId) return error('companyId es obligatorio');

    const getPeriodData = async (periodId: string | null, year: string | null) => {
      const filter: Record<string, unknown> = { companyId, status: 'POSTED' };
      if (periodId) filter.periodId = periodId;
      if (year) filter.entryDate = { gte: new Date(parseInt(year), 0, 1), lte: new Date(parseInt(year), 11, 31, 23, 59, 59) };

      const entries = await db.journalEntry.findMany({
        where: filter,
        include: { lines: { include: { account: { select: { id: true, code: true, name: true, accountType: true, nature: true, isGroup: true } } } } },
      });

      const lines = entries.flatMap(e => e.lines);
      const byAccount: Record<string, { debit: number; credit: number; name: string; code: string; accountType: string }> = {};

      for (const line of lines) {
        if (!byAccount[line.accountId]) {
          byAccount[line.accountId] = { debit: 0, credit: 0, name: line.account.name, code: line.account.code, accountType: line.account.accountType };
        }
        byAccount[line.accountId].debit += line.debit;
        byAccount[line.accountId].credit += line.credit;
      }

      const balances: Record<string, number> = {};
      for (const acc of Object.values(byAccount)) {
        let balance: number;
        if (acc.accountType === 'ASSET' || acc.accountType === 'EXPENSE') {
          balance = acc.debit - acc.credit;
        } else {
          balance = acc.credit - acc.debit;
        }
        balances[acc.accountType] = (balances[acc.accountType] || 0) + balance;
      }

      return {
        assets: Math.round((balances['ASSET'] || 0) * 100) / 100,
        liabilities: Math.round((balances['LIABILITY'] || 0) * 100) / 100,
        equity: Math.round((balances['EQUITY'] || 0) * 100) / 100,
        income: Math.round((balances['INCOME'] || 0) * 100) / 100,
        expenses: Math.round((balances['EXPENSE'] || 0) * 100) / 100,
        netIncome: Math.round(((balances['INCOME'] || 0) - (balances['EXPENSE'] || 0)) * 100) / 100,
        byAccount,
      };
    };

    const [dataA, dataB] = await Promise.all([
      getPeriodData(periodAId || null, yearA || null),
      getPeriodData(periodBId || null, yearB || null),
    ]);

    if (reportType === 'BALANCE_SHEET') {
      return success({
        reportType: 'BALANCE_SHEET',
        periodA: { label: periodAId ? `Período ${periodAId}` : `Año ${yearA}`, ...dataA },
        periodB: { label: periodBId ? `Período ${periodBId}` : `Año ${yearB}`, ...dataB },
        comparison: {
          assetsChange: Math.round((dataA.assets - dataB.assets) * 100) / 100,
          liabilitiesChange: Math.round((dataA.liabilities - dataB.liabilities) * 100) / 100,
          equityChange: Math.round((dataA.equity - dataB.equity) * 100) / 100,
        },
      });
    }

    return success({
      reportType: 'INCOME_STATEMENT',
      periodA: { label: periodAId ? `Período ${periodAId}` : `Año ${yearA}`, ...dataA },
      periodB: { label: periodBId ? `Período ${periodBId}` : `Año ${yearB}`, ...dataB },
      comparison: {
        incomeChange: Math.round((dataA.income - dataB.income) * 100) / 100,
        expensesChange: Math.round((dataA.expenses - dataB.expenses) * 100) / 100,
        netIncomeChange: Math.round((dataA.netIncome - dataB.netIncome) * 100) / 100,
      },
    });
  } catch (err) {
    console.error('Error generating comparative report:', err);
    return serverError('Error al generar reporte comparativo');
  }
}
