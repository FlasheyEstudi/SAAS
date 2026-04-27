import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!companyId) return error('companyId es obligatorio');

    const dateFilter: Record<string, unknown> = {};
    if (year) dateFilter.gte = new Date(parseInt(year), 0, 1);
    if (month) {
      const m = parseInt(month);
      dateFilter.gte = new Date(parseInt(year || String(new Date().getFullYear())), m - 1, 1);
      dateFilter.lte = new Date(parseInt(year || String(new Date().getFullYear())), m, 0, 23, 59, 59);
    } else if (year) {
      dateFilter.lte = new Date(parseInt(year), 11, 31, 23, 59, 59);
    }

    const entries = await db.journalEntry.findMany({
      where: {
        companyId,
        status: 'POSTED',
        ...(Object.keys(dateFilter).length > 0 ? { entryDate: dateFilter } : {}),
      },
      include: {
        lines: { include: { account: { select: { id: true, code: true, name: true, accountType: true } } } },
      },
    });

    const allLines = entries.flatMap(e => e.lines);
    let ivaCollected = 0;
    let ivaPaid = 0;
    let isrWithheld = 0;
    let isrPaid = 0;

    for (const line of allLines) {
      const code = line.account.code.toLowerCase();
      const name = line.account.name.toLowerCase();

      if (code.includes('iva') || name.includes('iva')) {
        if (name.includes('trasladado') || name.includes('cobrado') || name.includes('por pagar') || line.account.accountType === 'LIABILITY') {
          ivaCollected += (Number(line.credit) || 0);
          ivaPaid += (Number(line.debit) || 0);
        }
      }
      if (code.includes('isr') || name.includes('isr') || name.includes('impuesto sobre la renta')) {
        if (name.includes('retenido') || name.includes('por pagar')) {
          isrWithheld += (Number(line.credit) || 0);
          isrPaid += (Number(line.debit) || 0);
        }
      }
    }

    const ivaNet = Math.round((ivaCollected - ivaPaid) * 100) / 100;
    const isrNet = Math.round((isrWithheld - isrPaid) * 100) / 100;

    return success({
      period: { year: year || null, month: month || null },
      iva: {
        collected: Math.round(ivaCollected * 100) / 100,
        paid: Math.round(ivaPaid * 100) / 100,
        net: ivaNet,
        type: ivaNet > 0 ? 'TO_PAY' : 'FAVORABLE',
      },
      isr: {
        withheld: Math.round(isrWithheld * 100) / 100,
        paid: Math.round(isrPaid * 100) / 100,
        net: isrNet,
        type: isrNet > 0 ? 'TO_PAY' : 'FAVORABLE',
      },
      totalTaxObligation: Math.round((ivaNet > 0 ? ivaNet : 0) * 100) / 100,
    });
  } catch (err) {
    console.error('Error fetching tax summary:', err);
    return serverError('Error al obtener resumen fiscal');
  }
}
