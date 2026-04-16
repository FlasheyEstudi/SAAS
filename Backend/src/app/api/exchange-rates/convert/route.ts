import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const amount = searchParams.get('amount');
    const date = searchParams.get('date');

    if (!companyId || !from || !to || !amount) {
      return error('companyId, from, to y amount son obligatorios');
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) return error('amount debe ser un número válido mayor o igual a 0');

    if (from === to) {
      return success({ from, to, rate: 1, amount: parsedAmount, result: parsedAmount, date: date || new Date().toISOString() });
    }

    const where: Record<string, unknown> = {
      companyId,
      fromCurrency: from,
      toCurrency: to,
      effectiveDate: { lte: date ? new Date(date) : new Date() },
    };

    let rate = await db.exchangeRate.findFirst({
      where,
      orderBy: { effectiveDate: 'desc' },
    });

    if (!rate) {
      const reverseRate = await db.exchangeRate.findFirst({
        where: {
          companyId,
          fromCurrency: to,
          toCurrency: from,
          effectiveDate: { lte: date ? new Date(date) : new Date() },
        },
        orderBy: { effectiveDate: 'desc' },
      });

      if (reverseRate) {
        const convertedRate = 1 / reverseRate.rate;
        return success({
          from, to,
          rate: Math.round(convertedRate * 1000000) / 1000000,
          amount: parsedAmount,
          result: Math.round(parsedAmount * convertedRate * 100) / 100,
          date: reverseRate.effectiveDate.toISOString(),
        });
      }

      return error('No se encontró tipo de cambio para el par de monedas');
    }

    return success({
      from, to,
      rate: rate.rate,
      amount: parsedAmount,
      result: Math.round(parsedAmount * rate.rate * 100) / 100,
      date: rate.effectiveDate.toISOString(),
    });
  } catch (err) {
    console.error('Error converting currency:', err);
    return serverError('Error al convertir moneda');
  }
}
