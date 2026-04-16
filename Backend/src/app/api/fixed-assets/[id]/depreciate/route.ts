import { db } from '@/lib/db';
import { success, notFound, error, serverError, created } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { year, month } = body;

    if (!year || !month) return error('year y month son obligatorios');

    const asset = await db.fixedAsset.findUnique({ where: { id } });
    if (!asset) return notFound('Activo fijo no encontrado');
    if (asset.status !== 'ACTIVE') return error('Solo se pueden depreciar activos activos');

    const existingDep = await db.fixedAssetDepreciation.findFirst({
      where: { fixedAssetId: id, periodYear: year, periodMonth: month },
    });
    if (existingDep) return error('Ya existe depreciación para este activo en el período indicado');

    const depreciableAmount = asset.purchaseAmount - asset.salvageValue;
    const monthlyDepreciation = depreciableAmount / asset.usefulLifeMonths;
    let depreciationAmount = monthlyDepreciation;

    if (asset.depreciationMethod === 'DECLINING') {
      const remainingLife = asset.usefulLifeMonths - asset.depreciations.length;
      depreciationAmount = (asset.currentBookValue - asset.salvageValue) / (remainingLife || 1);
    }

    if (depreciationAmount < 0) depreciationAmount = 0;
    if (depreciationAmount > asset.currentBookValue - asset.salvageValue) {
      depreciationAmount = asset.currentBookValue - asset.salvageValue;
    }

    depreciationAmount = Math.round(depreciationAmount * 100) / 100;
    const newAccumulated = Math.round((asset.accumulatedDepreciation + depreciationAmount) * 100) / 100;
    const newBookValue = Math.round((asset.purchaseAmount - newAccumulated) * 100) / 100;

    const depreciation = await db.$transaction(async (tx) => {
      const dep = await tx.fixedAssetDepreciation.create({
        data: {
          fixedAssetId: id,
          periodYear: parseInt(year),
          periodMonth: parseInt(month),
          depreciationAmount,
          accumulatedBefore: asset.accumulatedDepreciation,
          accumulatedAfter: newAccumulated,
          bookValueBefore: asset.currentBookValue,
          bookValueAfter: Math.max(newBookValue, asset.salvageValue),
        },
      });

      const newStatus = newBookValue <= asset.salvageValue ? 'FULLY_DEPRECIATED' : 'ACTIVE';
      await tx.fixedAsset.update({
        where: { id },
        data: {
          accumulatedDepreciation: newAccumulated,
          currentBookValue: Math.max(newBookValue, asset.salvageValue),
          status: newStatus,
        },
      });

      return dep;
    });

    return created(depreciation);
  } catch (err) {
    console.error('Error depreciating asset:', err);
    return serverError('Error al depreciar activo fijo');
  }
}
