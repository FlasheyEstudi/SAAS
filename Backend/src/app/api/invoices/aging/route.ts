import { success, error, serverError } from '@/lib/api-helpers';
import { getAgingReport } from '@/services/financial-reports.service';

/**
 * GET /api/invoices/aging - Accounts Receivable/Payable aging report
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    if (!companyId) return error('El parámetro companyId es obligatorio');

    const invoiceType = searchParams.get('invoiceType') as 'SALE' | 'PURCHASE' | null;
    const asOfDateStr = searchParams.get('asOfDate');
    const asOfDate = asOfDateStr ? new Date(asOfDateStr + 'T23:59:59.999Z') : undefined;

    const result = await getAgingReport(companyId, invoiceType || undefined, asOfDate);
    return success(result);
  } catch (err) {
    console.error('Error generating aging report:', err);
    return serverError('Error al generar el reporte de antigüedad de saldos');
  }
}

