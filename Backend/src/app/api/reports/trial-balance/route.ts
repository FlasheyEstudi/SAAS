import { success, error, serverError } from '@/lib/api-helpers';
import { resolvePeriod, getTrialBalance } from '@/services/financial-reports.service';

// ============================================================
// GET /api/reports/trial-balance - Trial Balance (Balanza de Comprobación)
// Query params: companyId (required), periodId (or year+month)
//
// Logic:
// 1. Get all accounts for the company
// 2. For each account, sum debits and credits from POSTED journal entry lines in the period
// 3. Calculate balance per account type
// 4. Return sorted by account code, with totals row
// ============================================================



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

    const result = await getTrialBalance(companyId, period.id);
    return success(result);
  } catch (err) {
    console.error('Error generating trial balance:', err);
    return serverError('Error al generar la Balanza de Comprobación');
  }
}

