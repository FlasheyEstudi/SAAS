import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

// ============================================================
// GET /api/reports/balance-sheet - Balance Sheet (Balance General)
// Query params: companyId (required), periodId (or year+month)
//
// Logic: Filter ASSET, LIABILITY, EQUITY accounts. Group by type.
// Calculate subtotals for each type and net equity.
// ============================================================

interface BalanceRow {
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

    // Get ASSET, LIABILITY, EQUITY leaf accounts
    const accounts = await db.account.findMany({
      where: {
        companyId,
        isActive: true,
        isGroup: false,
        accountType: { in: ['ASSET', 'LIABILITY', 'EQUITY'] },
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

    // Build rows grouped by type
    const assets: BalanceRow[] = [];
    const liabilities: BalanceRow[] = [];
    const equity: BalanceRow[] = [];
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    for (const account of accounts) {
      const totals = lineMap.get(account.id) || { totalDebit: 0, totalCredit: 0 };
      if (totals.totalDebit === 0 && totals.totalCredit === 0) continue;

      const balance = roundTwo(totals.totalDebit - totals.totalCredit);
      const row: BalanceRow = {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        totalDebit: totals.totalDebit,
        totalCredit: totals.totalCredit,
        balance,
      };

      switch (account.accountType) {
        case 'ASSET':
          assets.push(row);
          totalAssets += balance;
          break;
        case 'LIABILITY':
          liabilities.push(row);
          totalLiabilities += balance;
          break;
        case 'EQUITY':
          equity.push(row);
          totalEquity += balance;
          break;
      }
    }

    // Calculate "as of date" - last day of the period month
    const asOfDate = new Date(period.year, period.month, 0).toISOString().split('T')[0];

    return success({
      asOfDate,
      totalAssets: roundTwo(totalAssets),
      totalLiabilities: roundTwo(totalLiabilities),
      totalEquity: roundTwo(totalEquity),
      netEquity: roundTwo(totalAssets - totalLiabilities),
      assets,
      liabilities,
      equity,
    });
  } catch (err) {
    console.error('Error generating balance sheet:', err);
    return serverError('Error al generar el Balance General');
  }
}
