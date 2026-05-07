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
    const currentLines = await db.journalEntryLine.findMany({
      where: {
        journalEntry: {
          period: { year: currentPeriod.year, month: currentPeriod.month },
          status: 'POSTED',
          companyId: { in: targetCompanyIds },
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
      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;
      
      if (line.account.accountType === 'INCOME') {
        currentIncome += credit - debit;
      } else if (line.account.accountType === 'EXPENSE') {
        currentExpenses += debit - credit;
      } else if (line.account.accountType === 'ASSET') {
        currentAssets += debit - credit;
      } else if (line.account.accountType === 'LIABILITY') {
        currentLiabilities += credit - debit;
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
            period: { year: prevYear, month: prevMonth },
            status: 'POSTED',
            companyId: { in: targetCompanyIds },
          },
        },
        include: {
          account: { select: { accountType: true } },
        },
      });

      let prevAssets = 0;
      let prevLiabilities = 0;

      for (const line of prevLines) {
        const debit = Number(line.debit) || 0;
        const credit = Number(line.credit) || 0;

        if (line.account.accountType === 'INCOME') {
          prevIncome += credit - debit;
        } else if (line.account.accountType === 'EXPENSE') {
          prevExpenses += debit - credit;
        } else if (line.account.accountType === 'ASSET') {
          prevAssets += debit - credit;
        } else if (line.account.accountType === 'LIABILITY') {
          prevLiabilities += credit - debit;
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
      where: { companyId }, // Usamos los períodos de la principal como referencia temporal
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
              period: { 
                OR: chartPeriods.map(p => ({ year: p.year, month: p.month }))
              },
              status: 'POSTED',
              companyId: { in: targetCompanyIds },
            },
          },
          include: {
            account: { select: { accountType: true } },
            journalEntry: { select: { period: true } },
          },
        })
      : [];

    // Group by period
    const periodLineMap = new Map<string, typeof chartLines>();
    for (const line of chartLines) {
      const p = line.journalEntry.period;
      const key = `${p.year}-${p.month}`;
      if (!periodLineMap.has(key)) periodLineMap.set(key, []);
      periodLineMap.get(key)!.push(line);
    }

    for (const period of chartPeriods) {
      const pLines = periodLineMap.get(`${period.year}-${period.month}`) || [];
      let pIncome = 0;
      let pExpenses = 0;

      for (const line of pLines) {
        const debit = Number(line.debit) || 0;
        const credit = Number(line.credit) || 0;

        if (line.account.accountType === 'INCOME') {
          pIncome += credit - debit;
        } else if (line.account.accountType === 'EXPENSE') {
          pExpenses += debit - credit;
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
      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;
      costCenterMap.set(ccName, (costCenterMap.get(ccName) || 0) + (debit - credit));
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
