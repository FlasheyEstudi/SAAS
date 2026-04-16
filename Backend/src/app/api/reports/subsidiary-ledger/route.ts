import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const thirdPartyId = searchParams.get('thirdPartyId');

    if (!companyId || !thirdPartyId) return error('companyId y thirdPartyId son obligatorios');

    const thirdParty = await db.thirdParty.findUnique({ where: { id: thirdPartyId } });
    if (!thirdParty) return error('Tercero no encontrado');

    const invoices = await db.invoice.findMany({
      where: { companyId, thirdPartyId },
      include: {
        journalEntry: { select: { id: true, entryNumber: true, description: true, entryDate: true, status: true } },
      },
      orderBy: { issueDate: 'desc' },
    });

    const totalAmount = invoices.reduce((s, i) => s + i.totalAmount, 0);
    const totalPaid = invoices.reduce((s, i) => s + (i.totalAmount - i.balanceDue), 0);
    const totalPending = invoices.reduce((s, i) => s + i.balanceDue, 0);

    const saleInvoices = invoices.filter(i => i.invoiceType === 'SALE');
    const purchaseInvoices = invoices.filter(i => i.invoiceType === 'PURCHASE');

    return success({
      thirdParty: {
        id: thirdParty.id,
        name: thirdParty.name,
        type: thirdParty.type,
        taxId: thirdParty.taxId,
      },
      summary: {
        totalInvoices: invoices.length,
        saleInvoices: saleInvoices.length,
        purchaseInvoices: purchaseInvoices.length,
        totalAmount: Math.round(totalAmount * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalPending: Math.round(totalPending * 100) / 100,
      },
      invoices: invoices.map(i => ({
        id: i.id,
        number: i.number,
        invoiceType: i.invoiceType,
        issueDate: i.issueDate,
        dueDate: i.dueDate,
        totalAmount: Math.round(i.totalAmount * 100) / 100,
        balanceDue: Math.round(i.balanceDue * 100) / 100,
        status: i.status,
        journalEntryId: i.journalEntryId,
        journalEntryNumber: i.journalEntry?.entryNumber || null,
      })),
    });
  } catch (err) {
    console.error('Error generating subsidiary ledger:', err);
    return serverError('Error al generar mayor auxiliar');
  }
}
