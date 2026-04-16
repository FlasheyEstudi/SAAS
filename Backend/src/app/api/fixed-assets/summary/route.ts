import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    if (!companyId) return error('companyId es obligatorio');

    const [assets, byType] = await Promise.all([
      db.fixedAsset.findMany({ where: { companyId } }),
      db.fixedAsset.groupBy({
        by: ['assetType'],
        where: { companyId },
        _sum: { purchaseAmount: true, currentBookValue: true, accumulatedDepreciation: true },
        _count: true,
      }),
    ]);

    const totalPurchaseAmount = assets.reduce((s, a) => s + a.purchaseAmount, 0);
    const totalBookValue = assets.reduce((s, a) => s + a.currentBookValue, 0);
    const totalAccumulated = assets.reduce((s, a) => s + a.accumulatedDepreciation, 0);

    const byTypeSummary = byType.map(b => ({
      assetType: b.assetType,
      count: b._count,
      totalPurchaseAmount: b._sum.purchaseAmount || 0,
      totalBookValue: b._sum.currentBookValue || 0,
      totalAccumulatedDepreciation: b._sum.accumulatedDepreciation || 0,
    }));

    return success({
      totalAssets: assets.length,
      activeAssets: assets.filter(a => a.status === 'ACTIVE').length,
      totalPurchaseAmount: Math.round(totalPurchaseAmount * 100) / 100,
      totalBookValue: Math.round(totalBookValue * 100) / 100,
      totalAccumulatedDepreciation: Math.round(totalAccumulated * 100) / 100,
      byType: byTypeSummary,
    });
  } catch (err) {
    console.error('Error fetching fixed assets summary:', err);
    return serverError('Error al obtener resumen de activos fijos');
  }
}
