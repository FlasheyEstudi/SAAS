import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const topN = parseInt(searchParams.get('topN') || '10');
    const year = searchParams.get('year');

    if (!companyId) return error('companyId es obligatorio');

    const invoices = await db.invoice.findMany({
      where: {
        companyId,
        invoiceType: 'PURCHASE',
        status: { in: ['PAID', 'PARTIAL', 'PENDING'] },
        ...(year ? { issueDate: { gte: new Date(parseInt(year), 0, 1), lte: new Date(parseInt(year), 11, 31, 23, 59, 59) } } : {}),
      },
      include: { thirdParty: { select: { id: true, name: true, taxId: true } } },
    });

    const supplierTotals: Record<string, { name: string; taxId: string | null; totalAmount: number; paidAmount: number; invoiceCount: number }> = {};
    for (const inv of invoices) {
      if (!supplierTotals[inv.thirdPartyId]) {
        supplierTotals[inv.thirdPartyId] = { name: inv.thirdParty.name, taxId: inv.thirdParty.taxId, totalAmount: 0, paidAmount: 0, invoiceCount: 0 };
      }
      supplierTotals[inv.thirdPartyId].totalAmount += Number(inv.totalAmount) || 0;
      supplierTotals[inv.thirdPartyId].paidAmount += (Number(inv.totalAmount) || 0) - (Number(inv.balanceDue) || 0);
      supplierTotals[inv.thirdPartyId].invoiceCount++;
    }

    const sorted = Object.entries(supplierTotals)
      .map(([id, data]) => ({ id, ...data, totalAmount: Math.round(data.totalAmount * 100) / 100, paidAmount: Math.round(data.paidAmount * 100) / 100 }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, topN);

    return success({ topN, totalSuppliers: Object.keys(supplierTotals).length, suppliers: sorted });
  } catch (err) {
    console.error('Error fetching top suppliers:', err);
    return serverError('Error al obtener top proveedores');
  }
}
