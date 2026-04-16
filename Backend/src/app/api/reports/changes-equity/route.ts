import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const periodId = searchParams.get('periodId');
    const year = searchParams.get('year');

    if (!companyId) return error('companyId es obligatorio');

    const periodFilter: Record<string, unknown> = { companyId, status: 'POSTED' };
    if (periodId) periodFilter.periodId = periodId;
    if (year) periodFilter.entryDate = { gte: new Date(parseInt(year), 0, 1), lte: new Date(parseInt(year), 11, 31, 23, 59, 59) };

    const entries = await db.journalEntry.findMany({
      where: periodFilter,
      include: {
        lines: { include: { account: { select: { id: true, code: true, name: true, accountType: true } } } },
      },
    });

    const allLines = entries.flatMap(e => e.lines);

    let netIncome = 0;
    let capitalContributions = 0;
    let withdrawals = 0;
    let retainedEarningsStart = 0;

    for (const line of allLines) {
      if (line.account.accountType === 'INCOME') netIncome += line.credit - line.debit;
      if (line.account.accountType === 'EXPENSE') netIncome -= line.debit - line.credit;
      if (line.account.accountType === 'EQUITY') {
        if (line.account.code.startsWith('3.1') || line.account.name.toLowerCase().includes('capital')) {
          capitalContributions += line.credit - line.debit;
        }
        if (line.account.name.toLowerCase().includes('utilidad') || line.account.code.startsWith('3.2')) {
          withdrawals += line.debit - line.credit;
        }
      }
    }

    netIncome = Math.round(netIncome * 100) / 100;
    capitalContributions = Math.round(capitalContributions * 100) / 100;
    withdrawals = Math.round(withdrawals * 100) / 100;

    const endingRetainedEarnings = Math.round((retainedEarningsStart + netIncome - withdrawals) * 100) / 100;
    const totalEquity = Math.round((capitalContributions + endingRetainedEarnings) * 100) / 100;

    return success({
      companyId,
      periodYear: year ? parseInt(year) : null,
      equityChanges: {
        beginningBalance: retainedEarningsStart,
        netIncome,
        capitalContributions,
        withdrawals,
        endingRetainedEarnings,
      },
      totalEquity,
    });
  } catch (err) {
    console.error('Error generating changes in equity report:', err);
    return serverError('Error al generar estado de cambios en patrimonio');
  }
}
