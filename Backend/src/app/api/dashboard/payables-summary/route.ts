import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    if (!companyId) return error('companyId es obligatorio');

    const invoices = await db.invoice.findMany({
      where: { companyId, invoiceType: 'PURCHASE', status: { in: ['PENDING', 'PARTIAL'] } },
      include: { thirdParty: { select: { id: true, name: true } } },
    });

    const now = new Date();
    const buckets = [
      { label: 'Current (0-30)', min: 0, max: 30, invoices: [] as typeof invoices, total: 0 },
      { label: '31-60 days', min: 31, max: 60, invoices: [] as typeof invoices, total: 0 },
      { label: '61-90 days', min: 61, max: 90, invoices: [] as typeof invoices, total: 0 },
      { label: 'Over 90 days', min: 91, max: Infinity, invoices: [] as typeof invoices, total: 0 },
    ];

    for (const inv of invoices) {
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.issueDate);
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

      const bucket = daysOverdue === 0
        ? buckets[0]
        : daysOverdue <= 30 ? buckets[0]
        : daysOverdue <= 60 ? buckets[1]
        : daysOverdue <= 90 ? buckets[2]
        : buckets[3];

      bucket.invoices.push(inv);
      bucket.total += (Number(inv.balanceDue) || 0);
    }

    const totalPayables = invoices.reduce((s, i) => s + (Number(i.balanceDue) || 0), 0);
    const overdueInvoices = invoices.filter(i => {
      const dueDate = i.dueDate ? new Date(i.dueDate) : new Date(i.issueDate);
      return dueDate < now;
    });
    const totalOverdue = overdueInvoices.reduce((s, i) => s + (Number(i.balanceDue) || 0), 0);

    return success({
      totalPayables: Math.round(totalPayables * 100) / 100,
      totalOverdue: Math.round(totalOverdue * 100) / 100,
      totalInvoices: invoices.length,
      overdueCount: overdueInvoices.length,
      agingBuckets: buckets.map(b => ({
        label: b.label,
        count: b.invoices.length,
        total: Math.round(b.total * 100) / 100,
        percent: totalPayables > 0 ? Math.round((b.total / totalPayables) * 10000) / 100 : 0,
      })),
    });
  } catch (err) {
    console.error('Error fetching payables summary:', err);
    return serverError('Error al obtener resumen de cuentas por pagar');
  }
}
