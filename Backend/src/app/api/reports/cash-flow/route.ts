import { success, error, serverError } from '@/lib/api-helpers';
import { getCashFlow } from '@/services/financial-reports.service';

/**
 * GET /api/reports/cash-flow - Cash Flow statement
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const periodId = searchParams.get('periodId');
    const year = searchParams.get('year');

    if (!companyId) return error('companyId es obligatorio');

    const result = await getCashFlow(
      companyId, 
      periodId || undefined, 
      year ? parseInt(year, 10) : undefined
    );
    return success(result);
  } catch (err) {
    console.error('Error generating cash flow report:', err);
    return serverError('Error al generar estado de flujo de efectivo');
  }
}

