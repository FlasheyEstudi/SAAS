'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, TrendingDown, Calculator, History } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { StatusBadge } from '@/components/ui/vintage-ui';
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { useFixedAssets } from '../hooks/useFixedAssets';

export function AssetsView() {
  const { assets, summary, loading, depreciating, refreshAssets, depreciateAsset, bulkDepreciate, getAssetHistory } = useFixedAssets();
  const [viewingHistory, setViewingHistory] = useState<string | null>(null);

  const handleBulkDepreciate = async () => {
    if (!confirm('¿Está seguro de calcular la depreciación para todos los activos activos?')) return;
    await bulkDepreciate();
  };

  const handleShowHistory = async (assetId: string) => {
    const history = await getAssetHistory(assetId);
    if (history) {
      setViewingHistory(assetId);
      toast.info(`Historial de ${assets.find(a => a.id === assetId)?.name}`);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h2 className="text-2xl font-playfair font-bold text-vintage-900">Activos Fijos</h2><p className="text-sm text-vintage-600 mt-1">Control de activos fijos y depreciación</p></div>
        <div className="flex gap-2">
          <PastelButton variant="outline" onClick={handleBulkDepreciate} disabled={depreciating}><Calculator className="w-4 h-4 mr-2" />Depreciar Todos</PastelButton>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <VintageCard><p className="text-xs text-vintage-500">Costo Total</p><p className="text-lg font-bold text-vintage-800">{formatCurrency(summary.totalCost)}</p></VintageCard>
          <VintageCard><p className="text-xs text-vintage-500">Valor en Libros</p><p className="text-lg font-bold text-success">{formatCurrency(summary.totalBookValue)}</p></VintageCard>
          <VintageCard><p className="text-xs text-vintage-500">Depreciación Acumulada</p><p className="text-lg font-bold text-error">{formatCurrency(summary.totalAccumulatedDepreciation)}</p></VintageCard>
          <VintageCard><p className="text-xs text-vintage-500">Total Activos</p><p className="text-lg font-bold text-vintage-800">{summary.totalAssets}</p></VintageCard>
          <VintageCard><p className="text-xs text-vintage-500">Activos</p><p className="text-lg font-bold text-success">{summary.activeAssets}</p></VintageCard>
          <VintageCard><p className="text-xs text-vintage-500">Depreciados</p><p className="text-lg font-bold text-info">{summary.fullyDepreciated}</p></VintageCard>
        </div>
      )}

      <VintageCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-vintage-200 bg-vintage-50/50">
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Activo</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Categoría</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-right">Costo</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-right">Valor en Libros</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-right">Depreciación</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vintage-100">
              {(!assets || assets.length === 0) ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-vintage-500">No hay activos registrados</td></tr>
              ) : (
                (assets || []).map((a: any, i: number) => (
                  <motion.tr key={a.id} className="hover:bg-vintage-50 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <td className="px-4 py-3"><div><p className="text-sm font-medium text-vintage-800">{a.name}</p><p className="text-xs text-vintage-500">Adq: {formatDate(a.acquisitionDate)}</p></div></td>
                    <td className="px-4 py-3 text-sm text-vintage-600">{a.category}</td>
                    <td className="px-4 py-3 text-sm text-vintage-700 text-right font-mono">{formatCurrency(a.acquisitionCost)}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-success">{formatCurrency(a.currentBookValue)}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-error">{formatCurrency(a.accumulatedDepreciation)}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge
                        status={a.status === 'ACTIVE' ? 'success' : a.status === 'FULLY_DEPRECIATED' ? 'info' : 'neutral'}
                        label={getStatusLabel(a.status)}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => depreciateAsset(a.id)} disabled={a.status !== 'ACTIVE'} className="p-1.5 rounded-lg hover:bg-vintage-100 text-vintage-600 disabled:opacity-30" title="Calcular depreciación"><TrendingDown className="w-4 h-4" /></button>
                        <button onClick={() => handleShowHistory(a.id)} className="p-1.5 rounded-lg hover:bg-vintage-100 text-vintage-600" title="Ver historial"><History className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </VintageCard>
    </div>
  );
}
