import { db } from '@/lib/db';
import { success, error, serverError, created } from '@/lib/api-helpers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, year, month } = body;

    if (!companyId || !year || !month) return error('companyId, year y month son obligatorios');

    const activeAssets = await db.fixedAsset.findMany({
      where: { companyId, status: 'ACTIVE' },
      include: { _count: { select: { depreciations: true } } },
    });

    if (activeAssets.length === 0) {
      return success({ depreciated: 0, skipped: 0, message: 'No hay activos activos para depreciar' });
    }

    let depreciated = 0;
    let skipped = 0;
    const results = [];

    for (const asset of activeAssets) {
      const existingDep = await db.fixedAssetDepreciation.findFirst({
        where: { fixedAssetId: asset.id, periodYear: parseInt(year), periodMonth: parseInt(month) },
      });
      if (existingDep) { skipped++; continue; }

      const depreciableAmount = asset.purchaseAmount - asset.salvageValue;
      const monthlyDepreciation = depreciableAmount / asset.usefulLifeMonths;
      let depreciationAmount = monthlyDepreciation;

      if (asset.depreciationMethod === 'DECLINING') {
        const remainingLife = asset.usefulLifeMonths - asset._count.depreciations;
        depreciationAmount = (asset.currentBookValue - asset.salvageValue) / (remainingLife || 1);
      }

      if (depreciationAmount < 0) depreciationAmount = 0;
      if (depreciationAmount > asset.currentBookValue - asset.salvageValue) {
        depreciationAmount = asset.currentBookValue - asset.salvageValue;
      }

      depreciationAmount = Math.round(depreciationAmount * 100) / 100;
      const newAccumulated = Math.round((asset.accumulatedDepreciation + depreciationAmount) * 100) / 100;
      const newBookValue = Math.round((asset.purchaseAmount - newAccumulated) * 100) / 100;

      await db.$transaction(async (tx) => {
        await tx.fixedAssetDepreciation.create({
          data: {
            fixedAssetId: asset.id,
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
          where: { id: asset.id },
          data: {
            accumulatedDepreciation: newAccumulated,
            currentBookValue: Math.max(newBookValue, asset.salvageValue),
            status: newStatus,
          },
        });
      });

      depreciated++;
      results.push({ assetId: asset.id, assetName: asset.name, depreciationAmount });
    }

    return created({ depreciated, skipped, results });
  } catch (err) {
    console.error('Error bulk depreciating:', err);
    return serverError('Error al depreciar activos en lote');
  }
}
