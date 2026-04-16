import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const fromCurrency = searchParams.get('fromCurrency');
    const toCurrency = searchParams.get('toCurrency');

    if (!companyId || !fromCurrency || !toCurrency) {
      return error('companyId, fromCurrency y toCurrency son obligatorios');
    }

    const rate = await db.exchangeRate.findFirst({
      where: {
        companyId,
        fromCurrency,
        toCurrency,
        effectiveDate: { lte: new Date() },
      },
      orderBy: { effectiveDate: 'desc' },
    });

    if (!rate) {
      return success({ rate: null, message: 'No se encontró tipo de cambio para el par de monedas' });
    }

    return success({
      id: rate.id,
      fromCurrency: rate.fromCurrency,
      toCurrency: rate.toCurrency,
      rate: rate.rate,
      effectiveDate: rate.effectiveDate,
      source: rate.source,
    });
  } catch (err) {
    console.error('Error fetching latest rate:', err);
    return serverError('Error al obtener tipo de cambio más reciente');
  }
}
