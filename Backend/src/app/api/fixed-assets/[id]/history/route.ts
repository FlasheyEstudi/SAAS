import { db } from '@/lib/db';
import { success, notFound, parsePagination, serverError } from '@/lib/api-helpers';
import type { PaginatedResponse } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);

    const asset = await db.fixedAsset.findUnique({ where: { id } });
    if (!asset) return notFound('Activo fijo no encontrado');

    const where = { fixedAssetId: id };

    const [history, total] = await Promise.all([
      db.depreciationEntry.findMany({
        where,
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.depreciationEntry.count({ where }),
    ]);

    const result: PaginatedResponse<typeof history[0]> = {
      data: history,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    };

    return success({
      asset: { id: asset.id, name: asset.name, purchaseAmount: asset.purchaseAmount, salvageValue: asset.salvageValue, currentBookValue: asset.currentBookValue, accumulatedDepreciation: asset.accumulatedDepreciation },
      history: result,
    });
  } catch (err) {
    console.error('Error fetching depreciation history:', err);
    return serverError('Error al obtener historial de depreciación');
  }
}
