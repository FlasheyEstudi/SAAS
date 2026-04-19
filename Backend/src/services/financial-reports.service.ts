import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export interface BalanceSheetRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export interface IncomeStatementRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

function roundTwo(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function resolvePeriod(companyId: string, periodId: string | null, year: number | null, month: number | null) {
  if (periodId) {
    return db.accountingPeriod.findFirst({ where: { id: periodId, companyId } });
  }
  if (year && month) {
    return db.accountingPeriod.findFirst({ where: { companyId, year, month } });
  }
  return null;
}

export async function getTrialBalance(companyId: string, periodId: string, consolidated = false) {
  const period = await db.accountingPeriod.findUnique({ where: { id: periodId } });
  if (!period) throw new Error('Período no encontrado');

  // Si es consolidado, obtenemos los IDs de todas las sucursales
  let targetCompanyIds = [companyId];
  if (consolidated) {
    const branches = await db.company.findMany({ where: { parentId: companyId } as any, select: { id: true } });
    targetCompanyIds = [companyId, ...branches.map(b => b.id)];
  }

  const accounts = await db.account.findMany({
    where: { companyId: { in: targetCompanyIds }, isActive: true },
    select: { id: true, code: true, name: true, accountType: true, isGroup: true },
    orderBy: { code: 'asc' },
  });

  const leafAccountIds = accounts.filter((a) => !a.isGroup).map((a) => a.id);

  const lineAggregates = leafAccountIds.length > 0
    ? await db.journalEntryLine.groupBy({
        by: ['accountId'],
        where: {
          accountId: { in: leafAccountIds },
          journalEntry: { 
            period: { year: period.year, month: period.month }, // Consolidado usa mismo período temporal en todas
            status: 'POSTED' 
          },
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

  const trialBalanceRows: TrialBalanceRow[] = [];
  let totalDebitSum = 0;
  let totalCreditSum = 0;
  let totalBalanceSum = 0;

  for (const account of accounts) {
    if (account.isGroup) continue;
    const totals = lineMap.get(account.id) || { totalDebit: 0, totalCredit: 0 };
    if (totals.totalDebit === 0 && totals.totalCredit === 0) continue;

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

  return {
    period: { id: period.id, year: period.year, month: period.month, status: period.status },
    accounts: trialBalanceRows,
    totals: {
      totalDebit: roundTwo(totalDebitSum),
      totalCredit: roundTwo(totalCreditSum),
      totalBalance: roundTwo(totalBalanceSum),
    },
  };
}

export async function getBalanceSheet(companyId: string, periodId: string, consolidated = false) {
  const period = await db.accountingPeriod.findUnique({ where: { id: periodId } });
  if (!period) throw new Error('Período no encontrado');

  let targetCompanyIds = [companyId];
  if (consolidated) {
    const branches = await db.company.findMany({ where: { parentId: companyId } as any, select: { id: true } });
    targetCompanyIds = [companyId, ...branches.map(b => b.id)];
  }

  const accounts = await db.account.findMany({
    where: {
      companyId: { in: targetCompanyIds },
      isActive: true,
      isGroup: false,
      accountType: { in: ['ASSET', 'LIABILITY', 'EQUITY'] },
    },
    select: { id: true, code: true, name: true, accountType: true },
    orderBy: { code: 'asc' },
  });

  const accountIds = accounts.map((a) => a.id);

  const lineAggregates = accountIds.length > 0
    ? await db.journalEntryLine.groupBy({
        by: ['accountId'],
        where: {
          accountId: { in: accountIds },
          journalEntry: { 
            period: { year: period.year, month: period.month },
            status: 'POSTED' 
          },
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

  const assets: BalanceSheetRow[] = [];
  const liabilities: BalanceSheetRow[] = [];
  const equity: BalanceSheetRow[] = [];
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  for (const account of accounts) {
    const totals = lineMap.get(account.id) || { totalDebit: 0, totalCredit: 0 };
    if (totals.totalDebit === 0 && totals.totalCredit === 0) continue;

    const balance = roundTwo(totals.totalDebit - totals.totalCredit);
    const row: BalanceSheetRow = {
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

  const asOfDate = new Date(period.year, period.month, 0).toISOString().split('T')[0];

  return {
    asOfDate,
    totalAssets: roundTwo(totalAssets),
    totalLiabilities: roundTwo(totalLiabilities),
    totalEquity: roundTwo(totalEquity),
    netEquity: roundTwo(totalAssets - totalLiabilities),
    assets,
    liabilities,
    equity,
  };
}

export async function getIncomeStatement(companyId: string, periodId: string, consolidated = false) {
  const period = await db.accountingPeriod.findUnique({ where: { id: periodId } });
  if (!period) throw new Error('Período no encontrado');

  let targetCompanyIds = [companyId];
  if (consolidated) {
    const branches = await db.company.findMany({ where: { parentId: companyId } as any, select: { id: true } });
    targetCompanyIds = [companyId, ...branches.map(b => b.id)];
  }

  const accounts = await db.account.findMany({
    where: {
      companyId: { in: targetCompanyIds },
      isActive: true,
      isGroup: false,
      accountType: { in: ['INCOME', 'EXPENSE'] },
    },
    select: { id: true, code: true, name: true, accountType: true },
    orderBy: { code: 'asc' },
  });

  const accountIds = accounts.map((a) => a.id);

  const lineAggregates = accountIds.length > 0
    ? await db.journalEntryLine.groupBy({
        by: ['accountId'],
        where: {
          accountId: { in: accountIds },
          journalEntry: { 
            period: { year: period.year, month: period.month },
            status: 'POSTED' 
          },
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

  const income: IncomeStatementRow[] = [];
  const expenses: IncomeStatementRow[] = [];
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const account of accounts) {
    const totals = lineMap.get(account.id) || { totalDebit: 0, totalCredit: 0 };
    if (totals.totalDebit === 0 && totals.totalCredit === 0) continue;

    const balance = account.accountType === 'INCOME'
      ? roundTwo(totals.totalCredit - totals.totalDebit)
      : roundTwo(totals.totalDebit - totals.totalCredit);

    const row: IncomeStatementRow = {
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

  return {
    period: { id: period.id, year: period.year, month: period.month, status: period.status },
    totalIncome: roundTwo(totalIncome),
    totalExpenses: roundTwo(totalExpenses),
    netIncome,
    grossMargin,
    income,
    expenses,
  };
}

export async function getAgingReport(companyId: string, invoiceType?: 'SALE' | 'PURCHASE', asOfDate?: Date) {
  const targetDate = asOfDate || new Date();
  
  const where: Prisma.InvoiceWhereInput = {
    companyId,
    balanceDue: { gt: 0 },
    status: { notIn: ['PAID', 'CANCELLED'] },
  };

  if (invoiceType) {
    where.invoiceType = invoiceType;
  }

  const invoices = await db.invoice.findMany({
    where,
    include: {
      thirdParty: {
        select: { id: true, name: true },
      },
    },
    orderBy: { dueDate: 'asc' },
  });

  type BucketKey = 'current' | 'overdue_31_60' | 'overdue_61_90' | 'overdue_90_plus';

  const buckets: Record<BucketKey, { count: number; total: number }> = {
    current: { count: 0, total: 0 },
    overdue_31_60: { count: 0, total: 0 },
    overdue_61_90: { count: 0, total: 0 },
    overdue_90_plus: { count: 0, total: 0 },
  };

  const details = invoices.map((inv) => {
    let daysOverdue = 0;
    let bucket: BucketKey = 'current';

    if (inv.dueDate) {
      const diffMs = targetDate.getTime() - inv.dueDate.getTime();
      daysOverdue = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      if (daysOverdue <= 30) {
        bucket = 'current';
      } else if (daysOverdue <= 60) {
        bucket = 'overdue_31_60';
      } else if (daysOverdue <= 90) {
        bucket = 'overdue_61_90';
      } else {
        bucket = 'overdue_90_plus';
      }
    }

    buckets[bucket].count += 1;
    buckets[bucket].total = roundTwo(buckets[bucket].total + inv.balanceDue);

    return {
      thirdPartyId: inv.thirdParty.id,
      thirdPartyName: inv.thirdParty.name,
      invoiceNumber: inv.number,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      totalAmount: inv.totalAmount,
      balanceDue: inv.balanceDue,
      daysOverdue,
      bucket,
    };
  });

  details.sort((a, b) => {
    const nameCompare = a.thirdPartyName.localeCompare(b.thirdPartyName);
    if (nameCompare !== 0) return nameCompare;
    return a.invoiceNumber.localeCompare(b.invoiceNumber);
  });

  const totalOutstanding = roundTwo(Object.values(buckets).reduce((sum, b) => sum + b.total, 0));

  return {
    buckets,
    totalOutstanding,
    details,
  };
}

export async function getCashFlow(companyId: string, periodId?: string, year?: number) {
  const periodFilter: Record<string, unknown> = { companyId, status: 'POSTED' };
  if (periodId) periodFilter.periodId = periodId;
  if (year) periodFilter.entryDate = { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31, 23, 59, 59) };

  const entries = await db.journalEntry.findMany({
    where: periodFilter,
    include: {
      lines: { include: { account: { select: { id: true, code: true, name: true, accountType: true, nature: true } } } },
    },
  });

  const allLines = entries.flatMap(e => e.lines);

  let netIncome = 0;
  for (const line of allLines) {
    if (line.account.accountType === 'INCOME') netIncome += line.credit - line.debit;
    if (line.account.accountType === 'EXPENSE') netIncome -= line.debit - line.credit;
  }
  netIncome = roundTwo(netIncome);

  let changeInReceivables = 0;
  let changeInPayables = 0;
  let changeInInventory = 0;
  let depreciationExpense = 0;

  for (const line of allLines) {
    if (line.account.accountType === 'ASSET') {
      const code = line.account.code;
      if (code.startsWith('1.3')) changeInReceivables += line.debit - line.credit;
    }
    if (line.account.accountType === 'LIABILITY') {
      const code = line.account.code;
      if (code.startsWith('2.1')) changeInPayables += line.credit - line.debit;
    }
    if (line.account.accountType === 'ASSET' && line.account.code.startsWith('1.2')) {
      changeInInventory += line.debit - line.credit;
    }
    if (line.account.code.toLowerCase().includes('depreciacion') || line.account.code.toLowerCase().includes('depreciación')) {
      depreciationExpense += line.debit - line.credit;
    }
  }

  const operatingActivities = netIncome + depreciationExpense - changeInReceivables + changeInPayables - changeInInventory;
  const investingActivities = 0;
  const financingActivities = 0;

  return {
    companyId,
    netIncome: roundTwo(netIncome),
    adjustments: {
      depreciation: roundTwo(depreciationExpense),
      changeInReceivables: roundTwo(changeInReceivables),
      changeInPayables: roundTwo(changeInPayables),
      changeInInventory: roundTwo(changeInInventory),
    },
    cashFlow: {
      operatingActivities: roundTwo(operatingActivities),
      investingActivities: roundTwo(investingActivities),
      financingActivities: roundTwo(financingActivities),
      netChange: roundTwo(operatingActivities + investingActivities + financingActivities),
    },
  };
}
