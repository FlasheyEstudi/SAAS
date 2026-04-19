import { success, error, serverError } from '@/lib/api-helpers';
import { resolvePeriod, getBalanceSheet } from '@/services/financial-reports.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const periodId = searchParams.get('periodId');
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    if (!companyId) return error('El parámetro companyId es obligatorio');

    const year = yearParam ? parseInt(yearParam, 10) : null;
    const month = monthParam ? parseInt(monthParam, 10) : null;

    const period = await resolvePeriod(companyId, periodId, year, month);
    if (!period) return error('Período contable no encontrado');

    const result = await getBalanceSheet(companyId, period.id);
    return success(result);
  } catch (err) {
    console.error('Error generating balance sheet:', err);
    return serverError('Error al generar el Balance General');
  }
}

