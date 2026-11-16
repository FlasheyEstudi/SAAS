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

  /* Fallback: el mes EN CURSO, no el último período creado. Antes tomaba el más reciente a
     secas, así que con el mes siguiente ya abierto los reportes (y el CFO Virtual) mostraban un
     mes futuro vacío en vez del que se está operando. Si el mes en curso no existe, se usa el
     período más reciente que no esté en el futuro. */
  const ahora = new Date();
  const mesActual = await db.accountingPeriod.findFirst({
    where: { companyId, year: ahora.getFullYear(), month: ahora.getMonth() + 1 },
  });
  if (mesActual) return mesActual;

  const anterior = await db.accountingPeriod.findFirst({
    where: {
      companyId,
      OR: [
        { year: { lt: ahora.getFullYear() } },
        { year: ahora.getFullYear(), month: { lte: ahora.getMonth() + 1 } },
      ],
    },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });
  if (anterior) return anterior;

  return await db.accountingPeriod.findFirst({
    where: { companyId },
    orderBy: [
      { year: 'desc' },
      { month: 'desc' },
    ],
  });
}

export async function getTrialBalance(
  companyId: string,
  periodId: string,
  consolidated = false,
  costCenterId?: string | null,
) {
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
          // `costCenterId` acota el reporte a una tienda/centro de costo concreto.
          ...(costCenterId ? { costCenterId } : {}),
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

export async function getBalanceSheet(
  companyId: string,
  periodId: string,
  consolidated = false,
  costCenterId?: string | null,
) {
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
          ...(costCenterId ? { costCenterId } : {}),
          journalEntry: { 
            entryDate: { lte: new Date(period.year, period.month, 0, 23, 59, 59) }, // Acumulativo hasta el fin del mes
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

  // 4. Calcular Utilidad/Pérdida del Ejercicio de forma dinámica (Audit M3)
  /* Se agrupa por `accountId` y el tipo se resuelve después: Prisma **no** acepta rutas de
     relación en `groupBy.by` ('account.accountType'), y el Balance General devolvía 500 en
     cuanto había movimientos. */
  const plAggregates = await db.journalEntryLine.groupBy({
    by: ['accountId'],
    where: {
      journalEntry: {
        companyId: { in: targetCompanyIds },
        entryDate: { lte: new Date(period.year, period.month, 0, 23, 59, 59) },
        status: 'POSTED'
      },
      account: { accountType: { in: ['INCOME', 'EXPENSE'] } }
    },
    _sum: { debit: true, credit: true }
  });

  const plTypes = await db.account.findMany({
    where: { id: { in: plAggregates.map((a) => a.accountId) } },
    select: { id: true, accountType: true },
  });
  const plTypePorCuenta = new Map(plTypes.map((a) => [a.id, a.accountType]));

  let totalIncome = 0;
  let totalExpenses = 0;
  for (const agg of plAggregates) {
    const debit = Number(agg._sum.debit || 0);
    const credit = Number(agg._sum.credit || 0);
    const tipo = plTypePorCuenta.get(agg.accountId);
    if (tipo === 'INCOME') totalIncome += (credit - debit);
    if (tipo === 'EXPENSE') totalExpenses += (debit - credit);
  }

  const netIncome = roundTwo(totalIncome - totalExpenses);

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

  // Inyectar Utilidad del Ejercicio en Patrimonio
  if (netIncome !== 0) {
    equity.push({
      accountId: 'virtual-net-income',
      accountCode: '3.9.99',
      accountName: 'Utilidad/Pérdida del Ejercicio (Calculado)',
      totalDebit: netIncome < 0 ? Math.abs(netIncome) : 0,
      totalCredit: netIncome > 0 ? netIncome : 0,
      balance: netIncome,
      level: 1,
      isGroup: false,
    });
    totalEquity += netIncome;
  }

  const asOfDate = new Date(period.year, period.month, 0).toISOString().split('T')[0];

  return {
    asOfDate,
    totalAssets: roundTwo(totalAssets),
    totalLiabilities: roundTwo(totalLiabilities),
    totalEquity: roundTwo(totalEquity),
    netIncome,
    netEquity: roundTwo(totalAssets - totalLiabilities),
    assets,
    liabilities,
    equity: equity.sort((a, b) => a.accountCode.localeCompare(b.accountCode)),
  };
}

export async function getIncomeStatement(
  companyId: string,
  periodId: string,
  consolidated = false,
  costCenterId?: string | null,
) {
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
          ...(costCenterId ? { costCenterId } : {}),
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
    // Clientes (AR) - Códigos 1.1.02
    if (line.account.accountType === 'ASSET' && line.account.code.startsWith('1.1.02')) changeInReceivables += Number(line.debit || 0) - Number(line.credit || 0);
    // Proveedores (AP) - Códigos 2.1.01
    if (line.account.accountType === 'LIABILITY' && line.account.code.startsWith('2.1.01')) changeInPayables += Number(line.credit || 0) - Number(line.debit || 0);
  }

  const operatingActivities = netIncome - changeInReceivables + changeInPayables;

  return {
    netIncome: roundTwo(netIncome),
    operatingActivities: roundTwo(operatingActivities),
    netChange: roundTwo(operatingActivities)
  };
}

export async function getFinancialSnapshot(
  companyId: string,
  periodoSolicitado?: { year?: number; month?: number } | null,
) {
  try {
    /* Si el usuario preguntó por otro mes («¿y en septiembre?»), el snapshot se arma con ese
       período: así el CFO responde con los números correctos sin depender de que el modelo
       se acuerde de pedir la herramienta. */
    const period = await resolvePeriod(
      companyId,
      null,
      periodoSolicitado?.year ?? null,
      periodoSolicitado?.month ?? null,
    );
    if (!period) {
      return 'No hay período contable para el mes consultado. Revisa que el mes esté creado en Ganesha.';
    }

    const company = await db.company.findUnique({ where: { id: companyId }, select: { name: true, currency: true } });

    // 1. Tendencia de ingresos/gastos (Últimos 3 meses)
    const last3Periods = await db.accountingPeriod.findMany({
      where: { companyId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 3,
      select: { id: true, year: true, month: true }
    });

    const periodIds = last3Periods.map(p => p.id);

    /* Antes se agrupaba por (asiento, cuenta): con miles de asientos eso son miles de filas
       viajando a Node, más dos consultas extra para traducir asiento→período y cuenta→tipo.
       Ahora se agrega **por período y cuenta en la base** (3 consultas chicas, ≤ nº de cuentas
       filas) y el tipo se resuelve con un solo mapa. Mismo resultado, mucho menos I/O. */
    const trendMap: Record<string, { ingresos: number, gastos: number }> = {};
    last3Periods.forEach(p => {
      trendMap[p.id] = { ingresos: 0, gastos: 0 };
    });

    const resumenPorPeriodo = await Promise.all(
      last3Periods.map(async (p) => {
        const filas = await db.journalEntryLine.groupBy({
          by: ['accountId'],
          where: {
            journalEntry: { periodId: p.id, status: 'POSTED' },
            account: { accountType: { in: ['INCOME', 'EXPENSE'] } },
          },
          _sum: { debit: true, credit: true },
        });
        return { periodo: p, filas };
      }),
    );

    const cuentasDeTendencia = await db.account.findMany({
      where: {
        id: { in: resumenPorPeriodo.flatMap((r) => r.filas.map((f) => f.accountId)) },
      },
      select: { id: true, accountType: true },
    });
    const accountTypes: Record<string, string> = {};
    cuentasDeTendencia.forEach(a => accountTypes[a.id] = a.accountType);

    for (const { periodo, filas } of resumenPorPeriodo) {
      for (const agg of filas) {
        const type = accountTypes[agg.accountId];
        if (!type) continue;

        const debit = Number(agg._sum.debit || 0);
        const credit = Number(agg._sum.credit || 0);

        if (type === 'INCOME') trendMap[periodo.id].ingresos += (credit - debit);
        else trendMap[periodo.id].gastos += (debit - credit);
      }
    }

    const trendTable = last3Periods.reverse().map(p => {
      const data = trendMap[p.id];
      return `| ${p.month}/${p.year} | ${roundTwo(data.ingresos)} | ${roundTwo(data.gastos)} |`;
    }).join('\n');

    // 2. Resumen de Cuentas por Cobrar/Pagar (Aging)
    const arAging = await getAgingReport(companyId, 'SALE');
    const apAging = await getAgingReport(companyId, 'PURCHASE');

    // 3. Saldos Bancarios
    const bankAccounts = await db.bankAccount.findMany({
      where: { companyId, isActive: true },
      select: { bankName: true, accountNumber: true, currentBalance: true, currency: true }
    });
    const bankSummary = bankAccounts.map(b => `- ${b.bankName} (${b.accountNumber}): ${roundTwo(b.currentBalance)} ${b.currency}`).join('\n');

    // 4. Top 5 Gastos
    const topExpenses = await db.journalEntryLine.groupBy({
      by: ['accountId'],
      where: {
        journalEntry: { companyId, status: 'POSTED' },
        account: { accountType: 'EXPENSE' }
      },
      _sum: { debit: true },
      orderBy: { _sum: { debit: 'desc' } },
      take: 5
    });
    
    const expenseAccounts = await db.account.findMany({
      where: { id: { in: topExpenses.map(e => e.accountId) } },
      select: { id: true, name: true }
    });
    const expenseSummary = topExpenses.map(e => {
      const acc = expenseAccounts.find(a => a.id === e.accountId);
      return `- ${acc?.name || 'Gasto'}: ${roundTwo(e._sum.debit)}`;
    }).join('\n');

    /* 3. Resultado por centro de costo (= cada tienda que sincroniza LogiFast), mes en curso y
       mes anterior. Se agrega en la base por (centro, cuenta): son pocas filas y permite que el
       CFO responda «¿cómo va esta tienda?» y «¿creció respecto al mes pasado?» sin pedir nada más.
       Se incluye el `id` del centro para que el modelo pueda usarlo en `get_ledger_data`. */
    const periodosComparar = await db.accountingPeriod.findMany({
      where: { companyId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 6,
      select: { id: true, year: true, month: true },
    });
    const otrosPeriodos = periodosComparar
      .filter((p) => p.id !== period.id)
      .sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))
      .slice(0, 1);
    const periodosCentro = [period, ...otrosPeriodos];

    const agregadosPorCentro = await Promise.all(
      periodosCentro.map(async (p) => ({
        periodo: p,
        filas: await db.journalEntryLine.groupBy({
          by: ['costCenterId', 'accountId'],
          where: {
            costCenterId: { not: null },
            journalEntry: { periodId: p.id, status: 'POSTED' },
            account: { accountType: { in: ['INCOME', 'EXPENSE'] } },
          },
          _sum: { debit: true, credit: true },
        }),
      })),
    );

    let centrosResumen = '';
    const centrosConMovimiento = agregadosPorCentro.flatMap((a) =>
      a.filas.map((f) => f.costCenterId!).filter(Boolean),
    );

    if (centrosConMovimiento.length > 0) {
      const centros = await db.costCenter.findMany({
        where: { id: { in: [...new Set(centrosConMovimiento)] } },
        select: { id: true, code: true, name: true },
      });

      // tipo de cuenta de todas las cuentas implicadas (una sola consulta)
      const cuentasImplicadas = new Set(agregadosPorCentro.flatMap((a) => a.filas.map((f) => f.accountId)));
      const tiposCuenta = await db.account.findMany({
        where: { id: { in: [...cuentasImplicadas] } },
        select: { id: true, accountType: true },
      });
      const tipoPorCuenta = new Map(tiposCuenta.map((c) => [c.id, c.accountType]));

      type Acum = { ingresos: number; gastos: number };
      const porPeriodo = new Map<string, Map<string, Acum>>(); // centroId -> periodoId -> acumulado

      for (const { periodo, filas } of agregadosPorCentro) {
        const mapa = new Map<string, Acum>();
        for (const fila of filas) {
          const centroId = fila.costCenterId;
          if (!centroId) continue;
          const actual = mapa.get(centroId) || { ingresos: 0, gastos: 0 };
          const debit = Number(fila._sum.debit || 0);
          const credit = Number(fila._sum.credit || 0);
          if (tipoPorCuenta.get(fila.accountId) === 'INCOME') actual.ingresos += credit - debit;
          else actual.gastos += debit - credit;
          mapa.set(centroId, actual);
        }
        porPeriodo.set(periodo.id, mapa);
      }

      const etiqueta = (p: { year: number; month: number }) => `${String(p.month).padStart(2, '0')}/${p.year}`;
      const delPeriodoActual = porPeriodo.get(period.id) || new Map<string, Acum>();

      centrosResumen = [...delPeriodoActual.entries()]
        .map(([centroId, v]) => {
          const centro = centros.find((c) => c.id === centroId);
          const anterior = otrosPeriodos[0] ? porPeriodo.get(otrosPeriodos[0].id)?.get(centroId) : null;
          const neto = roundTwo(v.ingresos - v.gastos);
          const comparativa = anterior
            ? ` | ${etiqueta(otrosPeriodos[0])}: neto ${roundTwo(anterior.ingresos - anterior.gastos)}`
            : '';
          const nombre = centro?.name || centroId;
          const id = centroId;
          return {
            neto,
            texto: `- ${nombre} (id: ${id} · código: ${centro?.code || '—'}): ${etiqueta(period)} → ingresos ${roundTwo(v.ingresos)} · gastos ${roundTwo(v.gastos)} · neto ${neto}${comparativa}`,
          };
        })
        .sort((a, b) => b.neto - a.neto)
        .map((f) => f.texto)
        .join('\n');
    }

    // 4. Construcción del Snapshot
    
    return `
=== ESTADO FINANCIERO ACTUAL: ${company?.name} ===
Moneda: ${company?.currency}
Período Activo: ${period.month}/${period.year} (${period.status})

RESULTADO DEL PERÍODO POR CENTRO DE COSTO (TIENDAS):
${centrosResumen || 'Aún no hay movimientos con centro de costo (llegan desde LogiFast al entregar pedidos).'}

TENDENCIA RECIENTE:
| Mes | Ingresos | Gastos |
| --- | --- | --- |
${trendTable}

CUENTAS PENDIENTES (CARTERA):
- Por Cobrar (Clientes): ${arAging.totalOutstanding} (Vencido >90d: ${arAging.buckets.overdue_90_plus.total})
- Por Pagar (Proveedores): ${apAging.totalOutstanding} (Vencido >90d: ${apAging.buckets.overdue_90_plus.total})

SALDOS BANCARIOS:
${bankSummary || 'No hay cuentas bancarias registradas.'}

TOP 5 GASTOS HISTÓRICOS:
${expenseSummary || 'No hay gastos registrados.'}

CAPACIDADES DE CONSULTA:
Tienes acceso a Balanzas de Comprobación, Balances Generales, Estados de Resultados, Flujos de Caja y Libros Auxiliares detallados de cualquier período.
`.trim();
  } catch (err) {
    console.error('Error en Snapshot:', err);
    return 'Error al obtener el snapshot financiero detallado.';
  }
}
