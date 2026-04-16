import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

// ============================================================
// GET /api/invoices/aging - Accounts Receivable/Payable aging report
// Query params: companyId (required), invoiceType (SALE/PURCHASE),
//   asOfDate (YYYY-MM-DD, defaults to today)
// ============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const companyId = searchParams.get('companyId');
    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    const invoiceType = searchParams.get('invoiceType') || '';
    if (!['SALE', 'PURCHASE', ''].includes(invoiceType)) {
      return error('El invoiceType debe ser SALE o PURCHASE');
    }

    const asOfDateStr = searchParams.get('asOfDate') || '';
    const asOfDate = asOfDateStr
      ? new Date(asOfDateStr + 'T23:59:59.999Z')
      : new Date();

    // Fetch all outstanding invoices (not PAID, not CANCELLED)
    const where: Prisma.InvoiceWhereInput = {
      companyId,
      balanceDue: { gt: 0 },
      status: { notIn: ['PAID', 'CANCELLED'] },
    };

    if (invoiceType) {
      where.invoiceType = invoiceType;
    }

    const invoices = await db.invoice.findMany({
      where,
      include: {
        thirdParty: {
          select: { id: true, name: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Compute aging for each invoice
    type BucketKey = 'current' | 'overdue_31_60' | 'overdue_61_90' | 'overdue_90_plus';

    const buckets: Record<BucketKey, { count: number; total: number }> = {
      current: { count: 0, total: 0 },
      overdue_31_60: { count: 0, total: 0 },
      overdue_61_90: { count: 0, total: 0 },
      overdue_90_plus: { count: 0, total: 0 },
    };

    const details = invoices.map((inv) => {
      let daysOverdue = 0;
      let bucket: BucketKey = 'current';

      if (inv.dueDate) {
        const diffMs = asOfDate.getTime() - inv.dueDate.getTime();
        daysOverdue = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        if (daysOverdue <= 30) {
          bucket = 'current';
        } else if (daysOverdue <= 60) {
          bucket = 'overdue_31_60';
        } else if (daysOverdue <= 90) {
          bucket = 'overdue_61_90';
        } else {
          bucket = 'overdue_90_plus';
        }
      }

      // Accumulate into buckets
      buckets[bucket].count += 1;
      buckets[bucket].total = Math.round((buckets[bucket].total + inv.balanceDue) * 100) / 100;

      return {
        thirdPartyId: inv.thirdParty.id,
        thirdPartyName: inv.thirdParty.name,
        invoiceNumber: inv.number,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        totalAmount: inv.totalAmount,
        balanceDue: inv.balanceDue,
        daysOverdue,
        bucket,
      };
    });

    // Sort details by thirdPartyName then invoiceNumber
    details.sort((a, b) => {
      const nameCompare = a.thirdPartyName.localeCompare(b.thirdPartyName);
      if (nameCompare !== 0) return nameCompare;
      return a.invoiceNumber.localeCompare(b.invoiceNumber);
    });

    const totalOutstanding = Math.round(
      Object.values(buckets).reduce((sum, b) => sum + b.total, 0) * 100
    ) / 100;

    return success({
      buckets,
      totalOutstanding,
      details,
    });
  } catch (err) {
    console.error('Error generating aging report:', err);
    return serverError('Error al generar el reporte de antigüedad de saldos');
  }
}
