import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

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

    if (!companyId) return error('El parámetro companyId es obligatorio');

    // Resolve current period
    let currentPeriod;
    if (periodId) {
      currentPeriod = await db.accountingPeriod.findFirst({ where: { id: periodId, companyId } });
    } else {
      // Get the most recent period
      currentPeriod = await db.accountingPeriod.findFirst({
        where: { companyId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      });
    }
    if (!currentPeriod) return error('No se encontró un período contable');

    // Get previous period for comparison
    let prevYear = currentPeriod.year;
    let prevMonth = currentPeriod.month - 1;
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }

    const prevPeriod = await db.accountingPeriod.findFirst({
      where: { companyId, year: prevYear, month: prevMonth },
    });

    // ---- Compute totals for current period ----
    const currentLines = await db.journalEntryLine.findMany({
      where: {
        journalEntry: {
          periodId: currentPeriod.id,
          status: 'POSTED',
          companyId,
        },
      },
      include: {
        account: { select: { accountType: true } },
        costCenter: { select: { id: true, name: true } },
      },
    });

    let currentIncome = 0;
    let currentExpenses = 0;
    let currentAssets = 0;
    let currentLiabilities = 0;

    for (const line of currentLines) {
      if (line.account.accountType === 'INCOME') {
        currentIncome += line.credit - line.debit;
      } else if (line.account.accountType === 'EXPENSE') {
        currentExpenses += line.debit - line.credit;
      } else if (line.account.accountType === 'ASSET') {
        currentAssets += line.debit - line.credit;
      } else if (line.account.accountType === 'LIABILITY') {
        currentLiabilities += line.credit - line.debit;
      }
    }

    currentIncome = roundTwo(currentIncome);
    currentExpenses = roundTwo(currentExpenses);
    const currentNetIncome = roundTwo(currentIncome - currentExpenses);
    const currentWorkingCapital = roundTwo(currentAssets - currentLiabilities);

    // ---- Compute totals for previous period ----
    let prevIncome = 0;
    let prevExpenses = 0;
    let prevNetIncome = 0;
    let prevWorkingCapital = 0;

    if (prevPeriod) {
      const prevLines = await db.journalEntryLine.findMany({
        where: {
          journalEntry: {
            periodId: prevPeriod.id,
            status: 'POSTED',
            companyId,
          },
        },
        include: {
          account: { select: { accountType: true } },
        },
      });

      let prevAssets = 0;
      let prevLiabilities = 0;

      for (const line of prevLines) {
        if (line.account.accountType === 'INCOME') {
          prevIncome += line.credit - line.debit;
        } else if (line.account.accountType === 'EXPENSE') {
          prevExpenses += line.debit - line.credit;
        } else if (line.account.accountType === 'ASSET') {
          prevAssets += line.debit - line.credit;
        } else if (line.account.accountType === 'LIABILITY') {
          prevLiabilities += line.credit - line.debit;
        }
      }

      prevIncome = roundTwo(prevIncome);
      prevExpenses = roundTwo(prevExpenses);
      prevNetIncome = roundTwo(prevIncome - prevExpenses);
      prevWorkingCapital = roundTwo(prevAssets - prevLiabilities);
    }

    // ---- Income vs Expense Chart (last 6 months) ----
    const chartData: Array<{ month: string; income: number; expenses: number }> = [];

    // Get the 6 periods before (and including) current
    const recentPeriods = await db.accountingPeriod.findMany({
      where: { companyId },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    // Filter to get at most 6 periods up to and including current
    const targetDate = new Date(currentPeriod.year, currentPeriod.month - 1);
    const sixMonthsAgo = new Date(targetDate);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);

    const chartPeriods = recentPeriods.filter((p) => {
      const pDate = new Date(p.year, p.month - 1);
      return pDate >= sixMonthsAgo && pDate <= targetDate;
    });

    // Get all lines for chart periods in a single query
    const chartPeriodIds = chartPeriods.map((p) => p.id);
    const chartLines = chartPeriodIds.length > 0
      ? await db.journalEntryLine.findMany({
          where: {
            journalEntry: {
              periodId: { in: chartPeriodIds },
              status: 'POSTED',
              companyId,
            },
          },
          include: {
            account: { select: { accountType: true } },
            journalEntry: { select: { periodId: true } },
          },
        })
      : [];

    // Group by period
    const periodLineMap = new Map<string, typeof chartLines>();
    for (const line of chartLines) {
      const pid = line.journalEntry.periodId;
      if (!periodLineMap.has(pid)) periodLineMap.set(pid, []);
      periodLineMap.get(pid)!.push(line);
    }

    for (const period of chartPeriods) {
      const pLines = periodLineMap.get(period.id) || [];
      let pIncome = 0;
      let pExpenses = 0;

      for (const line of pLines) {
        if (line.account.accountType === 'INCOME') {
          pIncome += line.credit - line.debit;
        } else if (line.account.accountType === 'EXPENSE') {
          pExpenses += line.debit - line.credit;
        }
      }

      chartData.push({
        month: `${MONTH_NAMES[period.month - 1]} ${period.year}`,
        income: roundTwo(pIncome),
        expenses: roundTwo(pExpenses),
      });
    }

    // ---- Expense by Cost Center ----
    const expenseByCostCenter: Array<{ costCenter: string; amount: number; percentage: number }> = [];

    // Group expense lines by cost center
    const expenseLines = currentLines.filter((l) => l.account.accountType === 'EXPENSE' && l.costCenterId);
    const costCenterMap = new Map<string, number>();

    for (const line of expenseLines) {
      const ccName = line.costCenter?.name || 'Sin centro de costo';
      costCenterMap.set(ccName, (costCenterMap.get(ccName) || 0) + (line.debit - line.credit));
    }

    for (const [ccName, amount] of costCenterMap) {
      expenseByCostCenter.push({
        costCenter: ccName,
        amount: roundTwo(amount),
        percentage: currentExpenses > 0 ? roundTwo((amount / currentExpenses) * 100) : 0,
      });
    }

    // Sort by amount descending
    expenseByCostCenter.sort((a, b) => b.amount - a.amount);

    // ---- Accounts Receivable & Payable ----
    const pendingInvoices = await db.invoice.findMany({
      where: { companyId, status: { in: ['PENDING', 'PARTIAL'] } },
    });

    const accountsReceivable = pendingInvoices
      .filter(i => i.invoiceType === 'SALE')
      .reduce((s, i) => s + i.balanceDue, 0);

    const accountsPayable = pendingInvoices
      .filter(i => i.invoiceType === 'PURCHASE')
      .reduce((s, i) => s + i.balanceDue, 0);

    const now = new Date();
    const overdueCount = pendingInvoices.filter(i => i.dueDate && new Date(i.dueDate) < now).length;

    // ---- Cash Balance ----
    const bankAccounts = await db.bankAccount.findMany({
      where: { companyId, isActive: true },
    });
    const cashBalance = bankAccounts.reduce((s, a) => s + a.currentBalance, 0);

    // ---- Pending Journal Entries ----
    const pendingEntriesCount = await db.journalEntry.count({
      where: { companyId, status: 'DRAFT' },
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
