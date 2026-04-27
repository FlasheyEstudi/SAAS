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
  level: number;
  isGroup: boolean;
}

export interface BalanceSheetRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
  level: number;
  isGroup: boolean;
}

export interface IncomeStatementRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
  level: number;
  isGroup: boolean;
}

function roundTwo(n: any): number {
  const val = (n !== null && typeof n === 'object') ? Number(n) : n;
  return Math.round((val || 0) * 100) / 100;
}

export async function resolvePeriod(
  companyId: string,
  periodId?: string | null,
  year?: any | null,
  month?: any | null
) {
  const y = year && !isNaN(Number(year)) ? Number(year) : null;
  const m = month && !isNaN(Number(month)) ? Number(month) : null;

  if (periodId) {
    return await db.accountingPeriod.findUnique({ where: { id: periodId } });
  }

  if (y && m) {
    return await db.accountingPeriod.findFirst({
      where: { companyId, year: y, month: m },
    });
  }

  // Fallback: Get most recent period for this company
  return await db.accountingPeriod.findFirst({
    where: { companyId },
    orderBy: [
      { year: 'desc' },
      { month: 'desc' },
    ],
  });
}

export async function getTrialBalance(companyId: string, periodId: string, consolidated = false) {
  const period = await db.accountingPeriod.findUnique({ where: { id: periodId } });
  if (!period) throw new Error('Período no encontrado');

  let targetCompanyIds = [companyId];
  if (consolidated) {
    const branches = await db.company.findMany({ where: { parentId: companyId } as any, select: { id: true } });
    targetCompanyIds = [companyId, ...branches.map(b => b.id)];
  }

  const accounts = await db.account.findMany({
    where: { companyId: { in: targetCompanyIds }, isActive: true },
    select: { id: true, code: true, name: true, accountType: true, isGroup: true, level: true, parentId: true },
    orderBy: { code: 'asc' },
  });

  const leafAccountIds = accounts.filter((a) => !a.isGroup).map((a) => a.id);

  const lineAggregates = leafAccountIds.length > 0
    ? await db.journalEntryLine.groupBy({
        by: ['accountId'],
        where: {
          accountId: { in: leafAccountIds },
          journalEntry: { 
            period: { year: period.year, month: period.month },
            status: 'POSTED' 
          },
        },
        _sum: { debit: true, credit: true },
      })
    : [];

  const balanceMap = new Map<string, { totalDebit: number; totalCredit: number; balance: number }>();
  for (const acc of accounts) {
    balanceMap.set(acc.id, { totalDebit: 0, totalCredit: 0, balance: 0 });
  }

  for (const agg of lineAggregates) {
    const debit = Number(agg._sum.debit || 0);
    const credit = Number(agg._sum.credit || 0);
    const acc = accounts.find(a => a.id === agg.accountId);
    if (!acc) continue;

    // Balance neto
    let balance: number;
    if (acc.accountType === 'INCOME' || acc.accountType === 'LIABILITY' || acc.accountType === 'EQUITY') {
      balance = credit - debit;
    } else {
      balance = debit - credit;
    }

    balanceMap.set(agg.accountId, { 
      totalDebit: roundTwo(debit), 
      totalCredit: roundTwo(credit), 
      balance: roundTwo(balance) 
    });
  }

  // Propagación jerárquica
  const sortedByLevel = [...accounts].sort((a, b) => b.level - a.level);
  for (const account of sortedByLevel) {
    if (account.parentId && balanceMap.has(account.id)) {
      const current = balanceMap.get(account.id)!;
      const parent = balanceMap.get(account.parentId);
      if (parent) {
        parent.totalDebit += current.totalDebit;
        parent.totalCredit += current.totalCredit;
        // El balance del padre es la suma de los balances hijos ya procesados
        parent.balance += current.balance;
      }
    }
  }

  const trialBalanceRows: TrialBalanceRow[] = [];
  let totalDebitSum = 0;
  let totalCreditSum = 0;
  let totalBalanceSum = 0;

  for (const account of accounts) {
    const totals = balanceMap.get(account.id)!;
    if (!account.isGroup && totals.totalDebit === 0 && totals.totalCredit === 0) continue;

    trialBalanceRows.push({
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      accountType: account.accountType,
      totalDebit: roundTwo(totals.totalDebit),
      totalCredit: roundTwo(totals.totalCredit),
      balance: roundTwo(totals.balance),
      level: account.level,
      isGroup: account.isGroup,
    });

    if (account.level === 1) {
      totalDebitSum += totals.totalDebit;
      totalCreditSum += totals.totalCredit;
      totalBalanceSum += totals.balance;
    }
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

  // Obtenemos todas las cuentas de Activo, Pasivo y Patrimonio (incluyendo grupos)
  const allAccounts = await db.account.findMany({
    where: {
      companyId: { in: targetCompanyIds },
      isActive: true,
      accountType: { in: ['ASSET', 'LIABILITY', 'EQUITY'] },
    },
    select: { id: true, code: true, name: true, accountType: true, isGroup: true, level: true, parentId: true },
    orderBy: { code: 'asc' },
  });

  const leafAccountIds = allAccounts.filter((a) => !a.isGroup).map((a) => a.id);

  const lineAggregates = leafAccountIds.length > 0
    ? await db.journalEntryLine.groupBy({
        by: ['accountId'],
        where: {
          accountId: { in: leafAccountIds },
          journalEntry: { 
            period: { year: period.year, month: period.month },
            status: 'POSTED' 
          },
        },
        _sum: { debit: true, credit: true },
      })
    : [];

  const balanceMap = new Map<string, { totalDebit: number; totalCredit: number; balance: number }>();
  
  // 1. Inicializamos todas las cuentas (incluyendo grupos) en 0
  for (const acc of allAccounts) {
    balanceMap.set(acc.id, { totalDebit: 0, totalCredit: 0, balance: 0 });
  }

  // 2. Cargamos saldos en las cuentas hijas (movimientos)
  for (const agg of lineAggregates) {
    const debit = Number(agg._sum.debit || 0);
    const credit = Number(agg._sum.credit || 0);
    const acc = allAccounts.find(a => a.id === agg.accountId);
    if (!acc) continue;

    // El balance depende del tipo de cuenta (Naturaleza)
    // Activo: Debe - Haber
    // Pasivo/Patrimonio: Haber - Debe
    const balance = acc.accountType === 'ASSET' ? (debit - credit) : (credit - debit);

    balanceMap.set(agg.accountId, { 
      totalDebit: roundTwo(debit), 
      totalCredit: roundTwo(credit), 
      balance: roundTwo(balance) 
    });
  }

  // 3. Propagación jerárquica de saldos (de abajo hacia arriba)
  const sortedByLevel = [...allAccounts].sort((a, b) => b.level - a.level);
  for (const account of sortedByLevel) {
    if (account.parentId && balanceMap.has(account.id)) {
      const current = balanceMap.get(account.id)!;
      const parent = balanceMap.get(account.parentId);
      if (parent) {
        parent.totalDebit += current.totalDebit;
        parent.totalCredit += current.totalCredit;
        parent.balance += current.balance;
      }
    }
  }

  const assets: BalanceSheetRow[] = [];
  const liabilities: BalanceSheetRow[] = [];
  const equity: BalanceSheetRow[] = [];
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  for (const account of allAccounts) {
    const totals = balanceMap.get(account.id)!;
    if (!account.isGroup && totals.totalDebit === 0 && totals.totalCredit === 0) continue;

    const row: BalanceSheetRow = {
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      totalDebit: roundTwo(totals.totalDebit),
      totalCredit: roundTwo(totals.totalCredit),
      balance: roundTwo(totals.balance),
      level: account.level,
      isGroup: account.isGroup,
    };

    switch (account.accountType) {
      case 'ASSET':
        assets.push(row);
        if (account.level === 1) totalAssets += row.balance;
        break;
      case 'LIABILITY':
        liabilities.push(row);
        if (account.level === 1) totalLiabilities += row.balance;
        break;
      case 'EQUITY':
        equity.push(row);
        if (account.level === 1) totalEquity += row.balance;
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

  const allAccounts = await db.account.findMany({
    where: {
      companyId: { in: targetCompanyIds },
      isActive: true,
      accountType: { in: ['INCOME', 'EXPENSE'] },
    },
    select: { id: true, code: true, name: true, accountType: true, isGroup: true, level: true, parentId: true },
    orderBy: { code: 'asc' },
  });

  const leafAccountIds = allAccounts.filter((a) => !a.isGroup).map((a) => a.id);

  const lineAggregates = leafAccountIds.length > 0
    ? await db.journalEntryLine.groupBy({
        by: ['accountId'],
        where: {
          accountId: { in: leafAccountIds },
          journalEntry: { 
            period: { year: period.year, month: period.month },
            status: 'POSTED' 
          },
        },
        _sum: { debit: true, credit: true },
      })
    : [];

  const balanceMap = new Map<string, { totalDebit: number; totalCredit: number; balance: number }>();
  
  for (const acc of allAccounts) {
    balanceMap.set(acc.id, { totalDebit: 0, totalCredit: 0, balance: 0 });
  }

  for (const agg of lineAggregates) {
    const debit = Number(agg._sum.debit || 0);
    const credit = Number(agg._sum.credit || 0);
    const acc = allAccounts.find(a => a.id === agg.accountId);
    if (!acc) continue;

    const balance = acc.accountType === 'INCOME' ? (credit - debit) : (debit - credit);

    balanceMap.set(agg.accountId, { 
      totalDebit: roundTwo(debit), 
      totalCredit: roundTwo(credit), 
      balance: roundTwo(balance) 
    });
  }

  const sortedByLevel = [...allAccounts].sort((a, b) => b.level - a.level);
  for (const account of sortedByLevel) {
    if (account.parentId && balanceMap.has(account.id)) {
      const current = balanceMap.get(account.id)!;
      const parent = balanceMap.get(account.parentId);
      if (parent) {
        parent.totalDebit += current.totalDebit;
        parent.totalCredit += current.totalCredit;
        parent.balance += current.balance;
      }
    }
  }

  const income: IncomeStatementRow[] = [];
  const expenses: IncomeStatementRow[] = [];
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const account of allAccounts) {
    const totals = balanceMap.get(account.id)!;
    if (!account.isGroup && totals.totalDebit === 0 && totals.totalCredit === 0) continue;

    const row: IncomeStatementRow = {
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      totalDebit: roundTwo(totals.totalDebit),
      totalCredit: roundTwo(totals.totalCredit),
      balance: roundTwo(totals.balance),
      level: account.level,
      isGroup: account.isGroup,
    };

    if (account.accountType === 'INCOME') {
      income.push(row);
      if (account.level === 1) totalIncome += row.balance;
    } else {
      expenses.push(row);
      if (account.level === 1) totalExpenses += row.balance;
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
      if (daysOverdue <= 30) bucket = 'current';
      else if (daysOverdue <= 60) bucket = 'overdue_31_60';
      else if (daysOverdue <= 90) bucket = 'overdue_61_90';
      else bucket = 'overdue_90_plus';
    }

    buckets[bucket].count += 1;
    buckets[bucket].total = roundTwo(buckets[bucket].total + Number(inv.balanceDue));

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

  return {
    buckets,
    totalOutstanding: roundTwo(Object.values(buckets).reduce((sum, b) => sum + b.total, 0)),
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
    if (line.account.accountType === 'INCOME') netIncome += Number(line.credit || 0) - Number(line.debit || 0);
    if (line.account.accountType === 'EXPENSE') netIncome -= Number(line.debit || 0) - Number(line.credit || 0);
  }

  let changeInReceivables = 0;
  let changeInPayables = 0;
  for (const line of allLines) {
    if (line.account.accountType === 'ASSET' && line.account.code.startsWith('1.3')) changeInReceivables += Number(line.debit || 0) - Number(line.credit || 0);
    if (line.account.accountType === 'LIABILITY' && line.account.code.startsWith('2.1')) changeInPayables += Number(line.credit || 0) - Number(line.debit || 0);
  }

  const operatingActivities = netIncome - changeInReceivables + changeInPayables;

  return {
    netIncome: roundTwo(netIncome),
    operatingActivities: roundTwo(operatingActivities),
    netChange: roundTwo(operatingActivities)
  };
}

export async function getFinancialSnapshot(companyId: string) {
  try {
    const period = await resolvePeriod(companyId);
    if (!period) return 'No hay períodos contables configurados.';

    // Obtener tendencia de los últimos 3 meses de forma ultra-rápida
    const last3Periods = await db.accountingPeriod.findMany({
      where: { companyId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 3
    });

    const trendData = await Promise.all(last3Periods.reverse().map(async (p) => {
      try {
        const journalEntries = await db.journalEntry.findMany({
          where: { periodId: p.id, status: { in: ['POSTED', 'DRAFT'] } },
          select: { id: true }
        });
        
        const entryIds = journalEntries.map(e => e.id);
        if (entryIds.length === 0) return { label: `${p.month}/${p.year}`, ingresos: 0, gastos: 0 };

        const lines = await db.journalEntryLine.findMany({
          where: {
            journalEntryId: { in: entryIds },
            account: { accountType: { in: ['INCOME', 'EXPENSE'] } }
          },
          select: { debit: true, credit: true, account: { select: { accountType: true } } }
        });

        let ingresos = 0;
        let gastos = 0;

        for (const line of lines) {
          if (line.account.accountType === 'INCOME') ingresos += Number(line.credit || 0) - Number(line.debit || 0);
          else gastos += Number(line.debit || 0) - Number(line.credit || 0);
        }
        
        return { 
          label: `${p.month}/${p.year}`, 
          ingresos: roundTwo(ingresos), 
          gastos: roundTwo(gastos) 
        };
      } catch (err) {
        return { label: `${p.month}/${p.year}`, ingresos: 0, gastos: 0 };
      }
    }));

    const trendTable = trendData.map(d => `| ${d.label} | ${d.ingresos} | ${d.gastos} |`).join('\n');

    return `
DATOS REALES CARGADOS:
| Mes | Ingresos | Gastos |
| --- | --- | --- |
${trendTable}
`.trim();
  } catch (err) {
    return 'Error al obtener el snapshot financiero.';
  }
}
