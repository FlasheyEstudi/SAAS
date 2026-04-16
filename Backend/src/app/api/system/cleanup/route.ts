import { db } from '@/lib/db';
import { success, created, serverError } from '@/lib/api-helpers';

export async function POST(_request: Request) {
  try {
    const results: Record<string, number> = {};

    const orphanLines = await db.journalEntryLine.findMany({
      where: { journalEntry: null },
    });
    if (orphanLines.length > 0) {
      for (const line of orphanLines) {
        try { await db.journalEntryLine.delete({ where: { id: line.id } }); } catch { /* skip */ }
      }
      results.orphanLinesRemoved = orphanLines.length;
    }

    const entries = await db.journalEntry.findMany({
      include: { lines: true },
    });

    let entriesUpdated = 0;
    for (const entry of entries) {
      const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
      const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);
      const diff = Math.round((totalDebit - totalCredit) * 100) / 100;

      if (entry.totalDebit !== totalDebit || entry.totalCredit !== totalCredit || entry.difference !== diff) {
        await db.journalEntry.update({
          where: { id: entry.id },
          data: { totalDebit, totalCredit, difference: diff },
        });
        entriesUpdated++;
      }
    }
    results.entriesRecalculated = entriesUpdated;

    let invoicesUpdated = 0;
    const invoices = await db.invoice.findMany();
    for (const inv of invoices) {
      const payments = inv.totalAmount - inv.balanceDue;
      if (payments >= inv.totalAmount && inv.status !== 'PAID') {
        await db.invoice.update({ where: { id: inv.id }, data: { status: 'PAID', balanceDue: 0 } });
        invoicesUpdated++;
      } else if (payments > 0 && payments < inv.totalAmount && inv.status === 'PENDING') {
        await db.invoice.update({ where: { id: inv.id }, data: { status: 'PARTIAL' } });
        invoicesUpdated++;
      }
    }
    results.invoicesStatusUpdated = invoicesUpdated;

    return created({
      success: true,
      message: 'Limpieza completada',
      results,
    });
  } catch (err) {
    console.error('Error during cleanup:', err);
    return serverError('Error durante la limpieza del sistema');
  }
}
