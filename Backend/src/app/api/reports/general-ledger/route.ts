import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const accountId = searchParams.get('accountId');
    const periodId = searchParams.get('periodId');

    if (!companyId || !accountId) return error('companyId y accountId son obligatorios');

    const account = await db.account.findUnique({
      where: { id: accountId },
      include: { parent: { select: { code: true, name: true } } },
    });
    if (!account) return error('Cuenta no encontrada');

    const entryFilter: Record<string, unknown> = {
      journalEntry: { companyId, status: 'POSTED' },
      accountId,
    };
    if (periodId) entryFilter.journalEntry = { ...entryFilter.journalEntry as Record<string, unknown>, periodId };

    const lines = await db.journalEntryLine.findMany({
      where: entryFilter,
      include: {
        journalEntry: {
          select: { id: true, entryNumber: true, description: true, entryDate: true, entryType: true },
        },
      },
      orderBy: { journalEntry: { entryDate: 'asc' } },
    });

    let runningBalance = 0;
    const movements = lines.map(line => {
      const debit = line.debit;
      const credit = line.credit;
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
        debit: Math.round(debit * 100) / 100,
        credit: Math.round(credit * 100) / 100,
        runningBalance: Math.round(runningBalance * 100) / 100,
      };
    });

    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);

    return success({
      account: { id: account.id, code: account.code, name: account.name, accountType: account.accountType, nature: account.nature },
      periodId: periodId || null,
      totalMovements: lines.length,
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      finalBalance: Math.round(runningBalance * 100) / 100,
      movements,
    });
  } catch (err) {
    console.error('Error generating general ledger:', err);
    return serverError('Error al generar libro mayor');
  }
}
