import { db } from '@/lib/db';
import { success, notFound, serverError } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ invoiceId: string }> };

// ============================================================
// GET /api/tax/entries/by-invoice/[invoiceId] - Obtener todas las
// entradas de impuesto de una factura específica
// Incluye desglose de IVA, retenciones y otros impuestos
// ============================================================
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { invoiceId } = await context.params;

    // Verificar que la factura existe
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        number: true,
        invoiceType: true,
        totalAmount: true,
        subtotal: true,
        taxAmount: true,
        issueDate: true,
        thirdParty: {
          select: { id: true, name: true, taxId: true },
        },
      },
    });

    if (!invoice) {
      return notFound('Factura no encontrada');
    }

    // Obtener todas las entradas de impuesto de la factura
    const taxEntries = await db.taxEntry.findMany({
      where: { invoiceId },
      include: {
        taxRate: {
          select: { id: true, name: true, rate: true, taxType: true, isRetention: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calcular totales agrupados por tipo de impuesto
    const ivaEntries = taxEntries.filter(e => e.taxType === 'IVA');
    const retIvaEntries = taxEntries.filter(e => e.taxType === 'RET_IVA');
    const isrEntries = taxEntries.filter(e => e.taxType === 'ISR');
    const retIsrEntries = taxEntries.filter(e => e.taxType === 'RET_ISR');
    const iepsEntries = taxEntries.filter(e => e.taxType === 'IEPS');
    const cedularEntries = taxEntries.filter(e => e.taxType === 'CEDULAR');

    const summary = {
      invoice,
      entries: taxEntries,
      totals: {
        iva: {
          entries: ivaEntries,
          totalTaxableBase: ivaEntries.reduce((sum, e) => sum + e.taxableBase, 0),
          totalTaxAmount: ivaEntries.reduce((sum, e) => sum + e.taxAmount, 0),
        },
        retencionIva: {
          entries: retIvaEntries,
          totalTaxableBase: retIvaEntries.reduce((sum, e) => sum + e.taxableBase, 0),
          totalWithholdingAmount: retIvaEntries.reduce((sum, e) => sum + e.withholdingAmount, 0),
        },
        isr: {
          entries: isrEntries,
          totalTaxableBase: isrEntries.reduce((sum, e) => sum + e.taxableBase, 0),
          totalTaxAmount: isrEntries.reduce((sum, e) => sum + e.taxAmount, 0),
        },
        retencionIsr: {
          entries: retIsrEntries,
          totalTaxableBase: retIsrEntries.reduce((sum, e) => sum + e.taxableBase, 0),
          totalWithholdingAmount: retIsrEntries.reduce((sum, e) => sum + e.withholdingAmount, 0),
        },
        ieps: {
          entries: iepsEntries,
          totalTaxableBase: iepsEntries.reduce((sum, e) => sum + e.taxableBase, 0),
          totalTaxAmount: iepsEntries.reduce((sum, e) => sum + e.taxAmount, 0),
        },
        cedular: {
          entries: cedularEntries,
          totalTaxableBase: cedularEntries.reduce((sum, e) => sum + e.taxableBase, 0),
          totalTaxAmount: cedularEntries.reduce((sum, e) => sum + e.taxAmount, 0),
        },
        // Totales generales
        totalTaxAmount: taxEntries.reduce((sum, e) => sum + e.taxAmount, 0),
        totalWithholdingAmount: taxEntries.reduce((sum, e) => sum + e.withholdingAmount, 0),
        netTaxAmount: taxEntries.reduce((sum, e) => sum + e.taxAmount - e.withholdingAmount, 0),
      },
    };

    return success(summary);
  } catch (err) {
    console.error('Error al obtener entradas de impuesto por factura:', err);
    return serverError('Error al obtener las entradas de impuesto de la factura');
  }
}
