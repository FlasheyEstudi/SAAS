import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const accountId = searchParams.get('accountId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (!companyId || !accountId) return error('companyId y accountId son obligatorios');

    const account = await db.account.findUnique({ where: { id: accountId } });
    if (!account) return error('Cuenta no encontrada');

    const dateFilter: Record<string, unknown> = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo);

    const lines = await db.journalEntryLine.findMany({
      where: {
        accountId,
        journalEntry: {
          companyId,
          status: 'POSTED',
          ...(Object.keys(dateFilter).length > 0 ? { entryDate: dateFilter } : {}),
        },
      },
      include: {
        journalEntry: {
          select: { id: true, entryNumber: true, description: true, entryDate: true, entryType: true, periodId: true },
        },
        costCenter: { select: { id: true, code: true, name: true } },
      },
      orderBy: { journalEntry: { entryDate: 'asc' } },
    });

    const priorLines = dateFrom
      ? await db.journalEntryLine.findMany({
          where: {
            accountId,
            journalEntry: { companyId, status: 'POSTED', entryDate: { lt: new Date(dateFrom) } },
          },
        })
      : [];

    let balanceForward = 0;
    for (const line of priorLines) {
      if (account.nature === 'DEBITOR') {
        balanceForward += line.debit - line.credit;
      } else {
        balanceForward += line.credit - line.debit;
      }
    }
    balanceForward = Math.round(balanceForward * 100) / 100;

    let runningBalance = balanceForward;
    const movements = lines.map(line => {
      const debit = Math.round(line.debit * 100) / 100;
      const credit = Math.round(line.credit * 100) / 100;
      if (account.nature === 'DEBITOR') {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }
      return {
        date: line.journalEntry.entryDate,
        entryNumber: line.journalEntry.entryNumber,
        entryType: line.journalEntry.entryType,
        description: line.description,
        costCenter: line.costCenter || null,
        debit,
        credit,
        runningBalance: Math.round(runningBalance * 100) / 100,
      };
    });

    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);

    return success({
      account: { id: account.id, code: account.code, name: account.name, accountType: account.accountType, nature: account.nature },
      period: { from: dateFrom || null, to: dateTo || null },
      balanceForward,
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      finalBalance: Math.round(runningBalance * 100) / 100,
      movementsCount: movements.length,
      movements,
    });
  } catch (err) {
    console.error('Error generating account movements:', err);
    return serverError('Error al generar movimientos de cuenta');
  }
}
