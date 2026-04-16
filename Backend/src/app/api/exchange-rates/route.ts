import { db } from '@/lib/db';
import { success, created, error, parsePagination, serverError } from '@/lib/api-helpers';
import type { PaginatedResponse } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);
    const companyId = searchParams.get('companyId') || '';
    const fromCurrency = searchParams.get('fromCurrency') || '';
    const toCurrency = searchParams.get('toCurrency') || '';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: Prisma.ExchangeRateWhereInput = {};
    if (companyId) where.companyId = companyId;
    if (fromCurrency) where.fromCurrency = fromCurrency;
    if (toCurrency) where.toCurrency = toCurrency;
    if (dateFrom || dateTo) {
      where.effectiveDate = {};
      if (dateFrom) (where.effectiveDate as Prisma.DateTimeNullableFilter).gte = new Date(dateFrom);
      if (dateTo) (where.effectiveDate as Prisma.DateTimeNullableFilter).lte = new Date(dateTo);
    }

    const [rates, total] = await Promise.all([
      db.exchangeRate.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.exchangeRate.count({ where }),
    ]);

    const result: PaginatedResponse<typeof rates[0]> = {
      data: rates,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    };
    return success(result);
  } catch (err) {
    console.error('Error listing exchange rates:', err);
    return serverError('Error al listar tipos de cambio');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, fromCurrency, toCurrency, rate, effectiveDate, source } = body;

    if (!companyId || !fromCurrency || !toCurrency || !rate || !effectiveDate) {
      return error('companyId, fromCurrency, toCurrency, rate y effectiveDate son obligatorios');
    }
    if (rate <= 0) return error('El tipo de cambio debe ser mayor a 0');

    const existing = await db.exchangeRate.findFirst({
      where: { companyId, fromCurrency, toCurrency, effectiveDate: new Date(effectiveDate) },
    });
    if (existing) return error('Ya existe un tipo de cambio para esa fecha y par de monedas');

    const newRate = await db.exchangeRate.create({
      data: {
        companyId, fromCurrency, toCurrency, rate: parseFloat(rate),
        effectiveDate: new Date(effectiveDate),
        source: source || 'MANUAL',
      },
    });

    return created(newRate);
  } catch (err) {
    console.error('Error creating exchange rate:', err);
    return serverError('Error al crear tipo de cambio');
  }
}
