import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

// ============================================================
// GET /api/reports/trial-balance - Trial Balance (Balanza de Comprobación)
// Query params: companyId (required), periodId (or year+month)
//
// Logic:
// 1. Get all accounts for the company
// 2. For each account, sum debits and credits from POSTED journal entry lines in the period
// 3. Calculate balance per account type
// 4. Return sorted by account code, with totals row
// ============================================================

interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

async function resolvePeriod(companyId: string, periodId: string | null, year: number | null, month: number | null) {
  if (periodId) {
    const period = await db.accountingPeriod.findFirst({
      where: { id: periodId, companyId },
    });
    if (!period) return null;
    return period;
  }

  if (year && month) {
    const period = await db.accountingPeriod.findFirst({
      where: { companyId, year, month },
    });
    if (!period) return null;
    return period;
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

    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    const year = yearParam ? parseInt(yearParam, 10) : null;
    const month = monthParam ? parseInt(monthParam, 10) : null;

    if (!periodId && (!year || !month)) {
      return error('Debe proporcionar periodId o year+month');
    }

    const period = await resolvePeriod(companyId, periodId, year, month);
    if (!period) {
      return error('Período contable no encontrado');
    }

    // 1. Get all accounts for the company, sorted by code
    const accounts = await db.account.findMany({
      where: { companyId, isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        accountType: true,
        isGroup: true,
      },
      orderBy: { code: 'asc' },
    });

    // 2. Sum debits and credits from POSTED journal entry lines in the period
    // We only look at leaf accounts (isGroup = false)
    const leafAccountIds = accounts.filter((a) => !a.isGroup).map((a) => a.id);

    const lineAggregates = leafAccountIds.length > 0
      ? await db.journalEntryLine.groupBy({
          by: ['accountId'],
          where: {
            accountId: { in: leafAccountIds },
            journalEntry: {
              periodId: period.id,
              status: 'POSTED',
            },
          },
          _sum: {
            debit: true,
            credit: true,
          },
        })
      : [];

    // Build a map: accountId -> { totalDebit, totalCredit }
    const lineMap = new Map<string, { totalDebit: number; totalCredit: number }>();
    for (const agg of lineAggregates) {
      lineMap.set(agg.accountId, {
        totalDebit: roundTwo(agg._sum.debit ?? 0),
        totalCredit: roundTwo(agg._sum.credit ?? 0),
      });
    }

    // 3. Build trial balance rows (only for leaf accounts with activity)
    // Also include all leaf accounts even if zero for completeness
    const trialBalanceRows: TrialBalanceRow[] = [];
    let totalDebitSum = 0;
    let totalCreditSum = 0;
    let totalBalanceSum = 0;

    for (const account of accounts) {
      if (account.isGroup) continue; // Skip group accounts

      const totals = lineMap.get(account.id) || { totalDebit: 0, totalCredit: 0 };

      // Skip accounts with zero activity (optional - include all for completeness)
      if (totals.totalDebit === 0 && totals.totalCredit === 0) continue;

      // Calculate balance based on account type
      // ASSET, LIABILITY, EQUITY, EXPENSE -> balance = totalDebit - totalCredit
      // INCOME -> balance = totalCredit - totalDebit
      let balance: number;
      if (account.accountType === 'INCOME') {
        balance = roundTwo(totals.totalCredit - totals.totalDebit);
      } else {
        balance = roundTwo(totals.totalDebit - totals.totalCredit);
      }

      trialBalanceRows.push({
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        accountType: account.accountType,
        totalDebit: totals.totalDebit,
        totalCredit: totals.totalCredit,
        balance,
      });

      totalDebitSum += totals.totalDebit;
      totalCreditSum += totals.totalCredit;
      totalBalanceSum += balance;
    }

    return success({
      companyId,
      period: {
        id: period.id,
        year: period.year,
        month: period.month,
        status: period.status,
      },
      accounts: trialBalanceRows,
      totals: {
        totalDebit: roundTwo(totalDebitSum),
        totalCredit: roundTwo(totalCreditSum),
        totalBalance: roundTwo(totalBalanceSum),
      },
    });
  } catch (err) {
    console.error('Error generating trial balance:', err);
    return serverError('Error al generar la Balanza de Comprobación');
  }
}
