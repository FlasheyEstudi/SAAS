import { db } from '@/lib/db';
import { success, serverError } from '@/lib/api-helpers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId } = body;

    const issues: string[] = [];

    const entries = await db.journalEntry.findMany({
      where: companyId ? { companyId } : {},
      include: { lines: true, company: { select: { id: true, name: true } } },
    });

    for (const entry of entries) {
      const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
      const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);
      const diff = Math.abs(Math.round((totalDebit - totalCredit) * 100) / 100);

      if (diff > 0.01) {
        issues.push(`Póliza ${entry.entryNumber} (${entry.company.name}): No cuadra. Diferencia: ${diff}`);
      }
      if (entry.lines.length < 2) {
        issues.push(`Póliza ${entry.entryNumber} (${entry.company.name}): Tiene menos de 2 partidas`);
      }
    }

    const invoiceOrphans = await db.invoice.findMany({
      where: companyId ? { companyId, thirdPartyId: null } : { thirdPartyId: null },
    });
    if (invoiceOrphans.length > 0) {
      issues.push(`${invoiceOrphans.length} facturas sin tercero asociado`);
    }

    const entryLineOrphans = await db.journalEntryLine.findMany({
      where: { account: null },
    });
    if (entryLineOrphans.length > 0) {
      issues.push(`${entryLineOrphans.length} partidas sin cuenta asociada`);
    }

    const postedEntriesWithDraftLines = entries.filter(e => e.status === 'POSTED' && e.lines.length === 0);
    if (postedEntriesWithDraftLines.length > 0) {
      issues.push(`${postedEntriesWithDraftLines.length} pólizas POSTED sin partidas`);
    }

    return success({
      valid: issues.length === 0,
      totalEntriesChecked: entries.length,
      issuesCount: issues.length,
      issues,
    });
  } catch (err) {
    console.error('Error validating integrity:', err);
    return serverError('Error al validar integridad de datos');
  }
}
