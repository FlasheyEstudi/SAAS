import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!companyId) return error('companyId es obligatorio');

    const periodYear = year ? parseInt(year) : new Date().getFullYear();
    const periodMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    const period = await db.accountingPeriod.findFirst({
      where: { companyId, year: periodYear, month: periodMonth },
    });

    const dateFrom = new Date(periodYear, periodMonth - 1, 1);
    const dateTo = new Date(periodYear, periodMonth, 0, 23, 59, 59);

    const [entries, invoices, bankAccounts, openPeriods, pendingInvoices] = await Promise.all([
      db.journalEntry.findMany({
        where: { companyId, status: 'POSTED', entryDate: { gte: dateFrom, lte: dateTo } },
        include: { lines: true },
      }),
      db.invoice.findMany({
        where: { companyId, issueDate: { gte: dateFrom, lte: dateTo } },
      }),
      db.bankAccount.findMany({ where: { companyId } }),
      db.accountingPeriod.count({ where: { companyId, status: 'OPEN' } }),
      db.invoice.findMany({
        where: { companyId, status: { in: ['PENDING', 'PARTIAL'] }, dueDate: { lte: dateTo } },
      }),
    ]);

    const lines = entries.flatMap(e => e.lines);
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      totalDebit += line.debit;
      totalCredit += line.credit;
      if (line.accountId) {
        const account = await db.account.findUnique({ where: { id: line.accountId }, select: { accountType: true } });
        if (account) {
          if (account.accountType === 'INCOME') totalIncome += line.credit - line.debit;
          if (account.accountType === 'EXPENSE') totalExpenses += line.debit - line.credit;
        }
      }
    }

    const totalCash = bankAccounts.reduce((s, a) => s + a.currentBalance, 0);
    const overdueInvoices = pendingInvoices.filter(i => i.dueDate && new Date(i.dueDate) < new Date());
    const totalOverdue = overdueInvoices.reduce((s, i) => s + i.balanceDue, 0);

    const alerts = [];
    if (overdueInvoices.length > 0) alerts.push({ type: 'WARNING', message: `${overdueInvoices.length} facturas vencidas por $${Math.round(totalOverdue)}` });
    if (openPeriods > 3) alerts.push({ type: 'WARNING', message: `${openPeriods} períodos abiertos` });
    if (totalExpenses > totalIncome) alerts.push({ type: 'ERROR', message: 'Gastos superan ingresos en este período' });

    return success({
      period: {
        year: periodYear,
        month: periodMonth,
        status: period?.status || 'NOT_FOUND',
      },
      kpis: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netIncome: Math.round((totalIncome - totalExpenses) * 100) / 100,
        profitMargin: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 10000) / 100 : 0,
        totalCash: Math.round(totalCash * 100) / 100,
        totalEntries: entries.length,
        totalInvoices: invoices.length,
        totalDebit: Math.round(totalDebit * 100) / 100,
        totalCredit: Math.round(totalCredit * 100) / 100,
        balanced: Math.abs(totalDebit - totalCredit) < 0.01,
      },
      alerts,
      pendingItems: {
        overdueInvoices: overdueInvoices.length,
        totalOverdue: Math.round(totalOverdue * 100) / 100,
        openPeriods,
      },
    });
  } catch (err) {
    console.error('Error fetching period overview:', err);
    return serverError('Error al obtener resumen del período');
  }
}
