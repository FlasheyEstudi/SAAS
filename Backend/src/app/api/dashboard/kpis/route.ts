import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';
import { runCompanyHealthCheck } from '@/services/health.service';

// ============================================================
// GET /api/dashboard/kpis - Dashboard KPIs
// Query params: companyId (required), periodId
//
// Returns: income, expenses, netIncome with vs last month %,
// incomeVsExpenseChart (last 6 months),
// expenseByCostCenter breakdown
// ============================================================

function roundTwo(n: number): number {
  return Math.round(n * 100) / 100;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return roundTwo(((current - previous) / Math.abs(previous)) * 100);
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const periodId = searchParams.get('periodId');
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');
    const consolidated = searchParams.get('consolidated') === 'true';

    if (!companyId) return error('El parámetro companyId es obligatorio');

    // Si es consolidado, obtenemos los IDs de todas las sucursales
    let targetCompanyIds = [companyId];
    if (consolidated) {
      const branches = await db.company.findMany({ where: { parentId: companyId } as any, select: { id: true } });
      targetCompanyIds = [companyId, ...branches.map(b => b.id)];
    }

    // Resolve current period
    let currentPeriod;
    if (periodId) {
      currentPeriod = await db.accountingPeriod.findFirst({ where: { id: periodId } });
    } else if (yearParam && monthParam) {
      currentPeriod = await db.accountingPeriod.findFirst({
        where: { 
          companyId, 
          year: parseInt(yearParam), 
          month: parseInt(monthParam) 
        },
      });
    } else {
      // Get the most recent period for the main company
      currentPeriod = await db.accountingPeriod.findFirst({
        where: { companyId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      });
    }

    // DISPARAR ESCÁNER DE SALUD ELITE (Proactivo)
    // Solo si no es consolidado para evitar duplicados en sucursales
    if (!consolidated) {
      runCompanyHealthCheck(companyId).catch(err => console.error('Health Check Error:', err));
    }

    if (!currentPeriod) {
      return success({
        totalRevenue: 0,
        revenueChange: 0,
        totalExpenses: 0,
        expenseChange: 0,
        netIncome: 0,
        netIncomeVsLastMonth: 0,
        accountsReceivable: 0,
        accountsPayable: 0,
        cashBalance: 0,
        overdueInvoices: 0,
        pendingJournalEntries: 0,
        workingCapital: 0,
        workingCapitalVsLastMonth: 0,
        incomeVsExpenseChart: [],
        expenseByCostCenter: [],
      });
    }

    // Get previous period for comparison
    let prevYear = currentPeriod.year;
    let prevMonth = currentPeriod.month - 1;
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }

    const prevPeriod = await db.accountingPeriod.findFirst({
      where: { companyId, year: prevYear, month: prevMonth },
    });

    // ---- Compute totals for current period ----
    // ---- Compute totals for current period (Audit M11 - Optimized Aggregation) ----
    const currentLinesAgg = await db.journalEntryLine.groupBy({
      by: ['accountId'],
      where: {
        journalEntry: {
          period: { year: currentPeriod.year, month: currentPeriod.month },
          status: 'POSTED',
          companyId: { in: targetCompanyIds },
        },
      },
      _sum: { debit: true, credit: true },
    });

    // Obtener los tipos de cuenta para estas líneas
    const currentAccountIds = currentLinesAgg.map(l => l.accountId);
    const currentAccounts = await db.account.findMany({
      where: { id: { in: currentAccountIds } },
      select: { id: true, accountType: true }
    });

    let currentIncome = 0;
    let currentExpenses = 0;
    let currentAssets = 0;
    let currentLiabilities = 0;

    for (const agg of currentLinesAgg) {
      const acc = currentAccounts.find(a => a.id === agg.accountId);
      if (!acc) continue;

      const debit = Number(agg._sum.debit) || 0;
      const credit = Number(agg._sum.credit) || 0;
      const type = acc.accountType;
      
      if (type === 'INCOME') currentIncome += credit - debit;
      else if (type === 'EXPENSE') currentExpenses += debit - credit;
      else if (type === 'ASSET') currentAssets += debit - credit;
      else if (type === 'LIABILITY') currentLiabilities += credit - debit;
    }

    currentIncome = roundTwo(currentIncome);
    currentExpenses = roundTwo(currentExpenses);
    const currentNetIncome = roundTwo(currentIncome - currentExpenses);
    const currentWorkingCapital = roundTwo(currentAssets - currentLiabilities);

    // ---- Compute totals for previous period (Aggregation) ----
    let prevIncome = 0;
    let prevExpenses = 0;
    let prevWorkingCapital = 0;

    if (prevPeriod) {
      const prevLinesAgg = await db.journalEntryLine.groupBy({
        by: ['accountId'],
        where: {
          journalEntry: {
            period: { year: prevYear, month: prevMonth },
            status: 'POSTED',
            companyId: { in: targetCompanyIds },
          },
        },
        _sum: { debit: true, credit: true },
      });

      const prevAccountIds = prevLinesAgg.map(l => l.accountId);
      const prevAccounts = await db.account.findMany({
        where: { id: { in: prevAccountIds } },
        select: { id: true, accountType: true }
      });

      let prevAssets = 0;
      let prevLiabilities = 0;

      for (const agg of prevLinesAgg) {
        const acc = prevAccounts.find(a => a.id === agg.accountId);
        if (!acc) continue;

        const debit = Number(agg._sum.debit) || 0;
        const credit = Number(agg._sum.credit) || 0;
        const type = acc.accountType;

        if (type === 'INCOME') prevIncome += credit - debit;
        else if (type === 'EXPENSE') prevExpenses += debit - credit;
        else if (type === 'ASSET') prevAssets += debit - credit;
        else if (type === 'LIABILITY') prevLiabilities += credit - debit;
      }

      prevIncome = roundTwo(prevIncome);
      prevExpenses = roundTwo(prevExpenses);
      prevWorkingCapital = roundTwo(prevAssets - prevLiabilities);
    }
    const prevNetIncome = roundTwo(prevIncome - prevExpenses);

    // ---- Income vs Expense Chart (last 6 months) - Optimized Query ----
    const chartData: Array<{ month: string; income: number; expenses: number }> = [];
    const targetDate = new Date(currentPeriod.year, currentPeriod.month - 1);
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(targetDate);
      d.setMonth(d.getMonth() - i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;

      const monthLinesAgg = await db.journalEntryLine.groupBy({
        by: ['accountId'],
        where: {
          journalEntry: {
            period: { year: y, month: m },
            status: 'POSTED',
            companyId: { in: targetCompanyIds },
          },
        },
        _sum: { debit: true, credit: true },
      });

      const monthAccIds = monthLinesAgg.map(l => l.accountId);
      const monthAccounts = await db.account.findMany({
        where: { id: { in: monthAccIds } },
        select: { id: true, accountType: true }
      });

      let pIncome = 0;
      let pExpenses = 0;
      for (const agg of monthLinesAgg) {
        const acc = monthAccounts.find(a => a.id === agg.accountId);
        if (!acc) continue;

        if (acc.accountType === 'INCOME') pIncome += (Number(agg._sum.credit) - Number(agg._sum.debit));
        if (acc.accountType === 'EXPENSE') pExpenses += (Number(agg._sum.debit) - Number(agg._sum.credit));
      }

      chartData.push({
        month: `${MONTH_NAMES[m - 1]} ${y}`,
        income: roundTwo(pIncome),
        expenses: roundTwo(pExpenses),
      });
    }

    // ---- Expense by Cost Center (Audit M11 - Aggregation) ----
    const expenseByCostCenter: Array<{ costCenter: string; amount: number; percentage: number }> = [];

    const costCenterAgg = await db.journalEntryLine.groupBy({
      by: ['costCenterId'],
      where: {
        journalEntry: {
          period: { year: currentPeriod.year, month: currentPeriod.month },
          status: 'POSTED',
          companyId: { in: targetCompanyIds },
        },
        account: { accountType: 'EXPENSE' },
        costCenterId: { not: null }
      },
      _sum: { debit: true, credit: true },
    });

    if (costCenterAgg.length > 0) {
      const ccIds = costCenterAgg.map(agg => agg.costCenterId as string);
      const ccNames = await db.costCenter.findMany({
        where: { id: { in: ccIds } },
        select: { id: true, name: true }
      });

      for (const agg of costCenterAgg) {
        const cc = ccNames.find(c => c.id === agg.costCenterId);
        const amount = roundTwo(Number(agg._sum.debit || 0) - Number(agg._sum.credit || 0));
        if (amount === 0) continue;

        expenseByCostCenter.push({
          costCenter: cc?.name || 'Desconocido',
          amount,
          percentage: currentExpenses > 0 ? roundTwo((amount / currentExpenses) * 100) : 0,
        });
      }
    }

    // Sort by amount descending
    expenseByCostCenter.sort((a, b) => b.amount - a.amount);

    // ---- Accounts Receivable & Payable ----
    const pendingInvoices = await db.invoice.findMany({
      where: { companyId: { in: targetCompanyIds }, status: { in: ['PENDING', 'PARTIAL'] } },
    });

    const accountsReceivable = pendingInvoices
      .filter(i => i.invoiceType === 'SALE')
      .reduce((s, i) => s + (Number(i.balanceDue) || 0), 0);

    const accountsPayable = pendingInvoices
      .filter(i => i.invoiceType === 'PURCHASE')
      .reduce((s, i) => s + (Number(i.balanceDue) || 0), 0);

    const now = new Date();
    const overdueCount = pendingInvoices.filter(i => i.dueDate && new Date(i.dueDate) < now).length;

    // ---- Cash Balance ----
    const bankAccounts = await db.bankAccount.findMany({
      where: { companyId: { in: targetCompanyIds }, isActive: true },
    });
    const cashBalance = bankAccounts.reduce((s, a) => s + (Number(a.currentBalance) || 0), 0);

    // ---- Pending Journal Entries ----
    const pendingEntriesCount = await db.journalEntry.count({
      where: { companyId: { in: targetCompanyIds }, status: 'DRAFT' },
    });

    return success({
      totalRevenue: currentIncome,
      revenueChange: pctChange(currentIncome, prevIncome),
      totalExpenses: currentExpenses,
      expenseChange: pctChange(currentExpenses, prevExpenses),
      netIncome: currentNetIncome,
      netIncomeVsLastMonth: pctChange(currentNetIncome, prevNetIncome),
      accountsReceivable: roundTwo(accountsReceivable),
      accountsPayable: roundTwo(accountsPayable),
      cashBalance: roundTwo(cashBalance),
      overdueInvoices: overdueCount,
      pendingJournalEntries: pendingEntriesCount,
      workingCapital: currentWorkingCapital,
      workingCapitalVsLastMonth: pctChange(currentWorkingCapital, prevWorkingCapital),
      incomeVsExpenseChart: chartData,
      expenseByCostCenter,
    });
  } catch (err) {
    console.error('Error computing KPIs:', err);
    return serverError('Error al calcular los KPIs del dashboard');
  }
}
