import { db } from '@/lib/db';
import { success, notFound, error, serverError, created } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const year = body.year ? Number(body.year) : null;
    const month = body.month ? Number(body.month) : null;

    if (!year || !month) return error('year y month son obligatorios y deben ser números válidos');

    const asset = await db.fixedAsset.findUnique({
      where: { id },
      include: { _count: { select: { depreciationEntries: true } } },
    });
    if (!asset) return notFound('Activo fijo no encontrado');
    if (asset.status !== 'ACTIVE') return error('Solo se pueden depreciar activos activos');
    if (Number(asset.usefulLifeMonths) <= 0) return error('La vida útil del activo debe ser mayor a 0 meses');

    const existingDep = await db.depreciationEntry.findFirst({
      where: { fixedAssetId: id, year, month },
    });
    if (existingDep) return error('Ya existe depreciación para este activo en el período indicado');

    const depreciableAmount = Number(asset.purchaseAmount) - Number(asset.salvageValue);
    const usefulLife = Number(asset.usefulLifeMonths) || 1;
    const monthlyDepreciation = depreciableAmount / usefulLife;
    let depreciationAmount = monthlyDepreciation;

    const depreciationCount = (asset as any)._count?.depreciationEntries || 0;
    if (asset.depreciationMethod === 'DECLINING') {
      const remainingLife = Number(asset.usefulLifeMonths) - depreciationCount;
      depreciationAmount = (Number(asset.currentBookValue) - Number(asset.salvageValue)) / (remainingLife || 1);
    }

    if (isNaN(depreciationAmount) || !isFinite(depreciationAmount) || depreciationAmount < 0) {
      depreciationAmount = 0;
    }
    
    if (depreciationAmount > Number(asset.currentBookValue) - Number(asset.salvageValue)) {
      depreciationAmount = Number(asset.currentBookValue) - Number(asset.salvageValue);
    }

    depreciationAmount = Math.round(depreciationAmount * 100) / 100;
    const newAccumulated = Math.round((Number(asset.accumulatedDepreciation) + depreciationAmount) * 100) / 100;
    const newBookValue = Math.round((Number(asset.purchaseAmount) - newAccumulated) * 100) / 100;

    const depreciation = await db.$transaction(async (tx) => {
      const dep = await tx.depreciationEntry.create({
        data: {
          companyId: asset.companyId,
          fixedAssetId: id,
          year: year!,
          month: month!,
          depreciationAmount,
          accumulatedTotal: newAccumulated,
          bookValueAfter: Math.max(newBookValue, Number(asset.salvageValue)),
        },
      });

      const newStatus = newBookValue <= Number(asset.salvageValue) ? 'FULLY_DEPRECIATED' : 'ACTIVE';
      await tx.fixedAsset.update({
        where: { id },
        data: {
          accumulatedDepreciation: newAccumulated,
          currentBookValue: Math.max(newBookValue, Number(asset.salvageValue)),
          status: newStatus as any,
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
