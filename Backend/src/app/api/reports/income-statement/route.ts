import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

// ============================================================
// GET /api/reports/income-statement - Income Statement (Estado de Resultados)
// Query params: companyId (required), periodId (or year+month)
//
// Logic: Filter INCOME and EXPENSE accounts. Calculate totals
// and net income (totalIncome - totalExpenses).
// ============================================================

interface IncomeRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

async function resolvePeriod(companyId: string, periodId: string | null, year: number | null, month: number | null) {
  if (periodId) {
    return db.accountingPeriod.findFirst({ where: { id: periodId, companyId } });
  }
  if (year && month) {
    return db.accountingPeriod.findFirst({ where: { companyId, year, month } });
  }
  return null;
}

function roundTwo(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const periodId = searchParams.get('periodId');
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    if (!companyId) return error('El parámetro companyId es obligatorio');

    const year = yearParam ? parseInt(yearParam, 10) : null;
    const month = monthParam ? parseInt(monthParam, 10) : null;

    if (!periodId && (!year || !month)) {
      return error('Debe proporcionar periodId o year+month');
    }

    const period = await resolvePeriod(companyId, periodId, year, month);
    if (!period) return error('Período contable no encontrado');

    // Get INCOME and EXPENSE leaf accounts
    const accounts = await db.account.findMany({
      where: {
        companyId,
        isActive: true,
        isGroup: false,
        accountType: { in: ['INCOME', 'EXPENSE'] },
      },
      select: { id: true, code: true, name: true, accountType: true },
      orderBy: { code: 'asc' },
    });

    const accountIds = accounts.map((a) => a.id);

    // Aggregate journal lines for the period
    const lineAggregates = accountIds.length > 0
      ? await db.journalEntryLine.groupBy({
          by: ['accountId'],
          where: {
            accountId: { in: accountIds },
            journalEntry: { periodId: period.id, status: 'POSTED' },
          },
          _sum: { debit: true, credit: true },
        })
      : [];

    const lineMap = new Map<string, { totalDebit: number; totalCredit: number }>();
    for (const agg of lineAggregates) {
      lineMap.set(agg.accountId, {
        totalDebit: roundTwo(agg._sum.debit ?? 0),
        totalCredit: roundTwo(agg._sum.credit ?? 0),
      });
    }

    const income: IncomeRow[] = [];
    const expenses: IncomeRow[] = [];
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const account of accounts) {
      const totals = lineMap.get(account.id) || { totalDebit: 0, totalCredit: 0 };
      if (totals.totalDebit === 0 && totals.totalCredit === 0) continue;

      // INCOME: balance = credit - debit
      // EXPENSE: balance = debit - credit
      const balance = account.accountType === 'INCOME'
        ? roundTwo(totals.totalCredit - totals.totalDebit)
        : roundTwo(totals.totalDebit - totals.totalCredit);

      const row: IncomeRow = {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        totalDebit: totals.totalDebit,
        totalCredit: totals.totalCredit,
        balance,
      };

      if (account.accountType === 'INCOME') {
        income.push(row);
        totalIncome += balance;
      } else {
        expenses.push(row);
        totalExpenses += balance;
      }
    }

    const netIncome = roundTwo(totalIncome - totalExpenses);
    const grossMargin = totalIncome > 0 ? roundTwo((netIncome / totalIncome) * 100) : 0;

    return success({
      period: {
        id: period.id,
        year: period.year,
        month: period.month,
        status: period.status,
      },
      totalIncome: roundTwo(totalIncome),
      totalExpenses: roundTwo(totalExpenses),
      netIncome,
      grossMargin,
      income,
      expenses,
    });
  } catch (err) {
    console.error('Error generating income statement:', err);
    return serverError('Error al generar el Estado de Resultados');
  }
}
