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
        lines: { include: { account: { select: { id: true, code: true, name: true, accountType: true, nature: true } } } },
      },
    });

    const allLines = entries.flatMap(e => e.lines);

    let netIncome = 0;
    for (const line of allLines) {
      if (line.account.accountType === 'INCOME') netIncome += line.credit - line.debit;
      if (line.account.accountType === 'EXPENSE') netIncome -= line.debit - line.credit;
    }
    netIncome = Math.round(netIncome * 100) / 100;

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
      if (line.account.code.includes('DEPRECIACION') || line.account.code.includes('Depreciación')) {
        depreciationExpense += line.debit - line.credit;
      }
    }

    const operatingActivities = netIncome + depreciationExpense - changeInReceivables + changeInPayables - changeInInventory;
    const investingActivities = 0;
    const financingActivities = 0;

    return success({
      companyId,
      netIncome: Math.round(netIncome * 100) / 100,
      adjustments: {
        depreciation: Math.round(depreciationExpense * 100) / 100,
        changeInReceivables: Math.round(changeInReceivables * 100) / 100,
        changeInPayables: Math.round(changeInPayables * 100) / 100,
        changeInInventory: Math.round(changeInInventory * 100) / 100,
      },
      cashFlow: {
        operatingActivities: Math.round(operatingActivities * 100) / 100,
        investingActivities: Math.round(investingActivities * 100) / 100,
        financingActivities: Math.round(financingActivities * 100) / 100,
        netChange: Math.round((operatingActivities + investingActivities + financingActivities) * 100) / 100,
      },
    });
  } catch (err) {
    console.error('Error generating cash flow report:', err);
    return serverError('Error al generar estado de flujo de efectivo');
  }
}
