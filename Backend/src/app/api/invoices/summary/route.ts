import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

// ============================================================
// GET /api/invoices/summary - Summary of invoices by status
// Query params: companyId (required), invoiceType (optional)
// Returns: { total, pending, partial, paid, cancelled,
//            totalAmount, totalBalanceDue }
// ============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const companyId = searchParams.get('companyId');
    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    const invoiceType = searchParams.get('invoiceType') || '';

    const where: Prisma.InvoiceWhereInput = { companyId };
    if (invoiceType && ['SALE', 'PURCHASE'].includes(invoiceType)) {
      where.invoiceType = invoiceType;
    }

    // Aggregate counts by status
    const [totalCount, pendingCount, partialCount, paidCount, cancelledCount, amountSummary] =
      await Promise.all([
        db.invoice.count({ where }),
        db.invoice.count({ where: { ...where, status: 'PENDING' } }),
        db.invoice.count({ where: { ...where, status: 'PARTIAL' } }),
        db.invoice.count({ where: { ...where, status: 'PAID' } }),
        db.invoice.count({ where: { ...where, status: 'CANCELLED' } }),
        db.invoice.aggregate({
          _sum: {
            totalAmount: true,
            balanceDue: true,
          },
          where: {
            ...where,
            status: { not: 'CANCELLED' },
          },
        }),
      ]);

    return success({
      total: totalCount,
      pending: pendingCount,
      partial: partialCount,
      paid: paidCount,
      cancelled: cancelledCount,
      totalAmount: Number(amountSummary._sum.totalAmount || 0),
      totalBalanceDue: Number(amountSummary._sum.balanceDue || 0),
    });
  } catch (err) {
    console.error('Error generating invoice summary:', err);
    return serverError('Error al generar el resumen de facturas');
  }
}
