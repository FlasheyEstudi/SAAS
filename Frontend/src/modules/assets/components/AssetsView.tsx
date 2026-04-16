'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { StatusBadge } from '@/components/ui/vintage-ui';
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

interface Asset {
  id: string; name: string; category: string; acquisitionDate: string; acquisitionCost: number;
  residualValue: number; usefulLifeMonths: number; depreciationMethod: 'STRAIGHT_LINE' | 'DECLINING_BALANCE';
  currentBookValue: number; accumulatedDepreciation: number; status: 'ACTIVE' | 'DISPOSED' | 'FULLY_DEPRECIATED';
}

const mockAssets: Asset[] = [
  { id: '1', name: 'Edificio Principal', category: 'Inmuebles', acquisitionDate: '2020-01-15', acquisitionCost: 4500000, residualValue: 500000, usefulLifeMonths: 300, depreciationMethod: 'STRAIGHT_LINE', currentBookValue: 3950000, accumulatedDepreciation: 550000, status: 'ACTIVE' },
  { id: '2', name: 'Camioneta Toyota Hilux 2022', category: 'Transporte', acquisitionDate: '2022-03-10', acquisitionCost: 580000, residualValue: 80000, usefulLifeMonths: 60, depreciationMethod: 'STRAIGHT_LINE', currentBookValue: 350000, accumulatedDepreciation: 230000, status: 'ACTIVE' },
  { id: '3', name: 'Equipo de Cómputo (Lote)', category: 'Equipo de Oficina', acquisitionDate: '2023-06-01', acquisitionCost: 320000, residualValue: 20000, usefulLifeMonths: 36, depreciationMethod: 'STRAIGHT_LINE', currentBookValue: 180000, accumulatedDepreciation: 140000, status: 'ACTIVE' },
  { id: '4', name: 'Mobiliario Ejecutivo', category: 'Mobiliario', acquisitionDate: '2021-01-20', acquisitionCost: 260000, residualValue: 30000, usefulLifeMonths: 120, depreciationMethod: 'STRAIGHT_LINE', currentBookValue: 185000, accumulatedDepreciation: 75000, status: 'ACTIVE' },
  { id: '5', name: 'Impresora Multifuncional HP', category: 'Equipo de Oficina', acquisitionDate: '2020-09-01', acquisitionCost: 45000, residualValue: 5000, usefulLifeMonths: 48, depreciationMethod: 'DECLINING_BALANCE', currentBookValue: 8000, accumulatedDepreciation: 37000, status: 'FULLY_DEPRECIATED' },
  { id: '6', name: 'Sistema de Vigilancia', category: 'Equipo de Seguridad', acquisitionDate: '2022-11-15', acquisitionCost: 95000, residualValue: 10000, usefulLifeMonths: 60, depreciationMethod: 'STRAIGHT_LINE', currentBookValue: 62000, accumulatedDepreciation: 33000, status: 'ACTIVE' },
  { id: '7', name: 'Aire Acondicionado Central', category: 'Instalaciones', acquisitionDate: '2019-05-01', acquisitionCost: 180000, residualValue: 15000, usefulLifeMonths: 120, depreciationMethod: 'STRAIGHT_LINE', currentBookValue: 95000, accumulatedDepreciation: 85000, status: 'ACTIVE' },
  { id: '8', name: 'Escritorio Antique (descontinuado)', category: 'Mobiliario', acquisitionDate: '2018-02-10', acquisitionCost: 35000, residualValue: 2000, usefulLifeMonths: 120, depreciationMethod: 'STRAIGHT_LINE', currentBookValue: 2000, accumulatedDepreciation: 33000, status: 'DISPOSED' },
];

export function AssetsView() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setTimeout(() => { setAssets(mockAssets); setLoading(false); }, 500); }, []);

  const activeAssets = assets.filter(a => a.status === 'ACTIVE');
  const totalValue = activeAssets.reduce((s, a) => s + a.currentBookValue, 0);
  const totalDepreciation = assets.reduce((s, a) => s + a.accumulatedDepreciation, 0);
  const totalCost = assets.reduce((s, a) => s + a.acquisitionCost, 0);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-playfair font-bold text-vintage-900">Activos Fijos</h2><p className="text-sm text-vintage-600 mt-1">Control de activos fijos y depreciación</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <VintageCard><p className="text-xs text-vintage-500">Costo Total</p><p className="text-xl font-bold text-vintage-800">{formatCurrency(totalCost)}</p></VintageCard>
        <VintageCard><p className="text-xs text-vintage-500">Valor en Libros</p><p className="text-xl font-bold text-success">{formatCurrency(totalValue)}</p></VintageCard>
        <VintageCard><p className="text-xs text-vintage-500">Depreciación Acumulada</p><p className="text-xl font-bold text-error">{formatCurrency(totalDepreciation)}</p></VintageCard>
        <VintageCard><p className="text-xs text-vintage-500">Activos Activos</p><p className="text-xl font-bold text-vintage-800">{activeAssets.length}</p></VintageCard>
      </div>

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
              </tr>
            </thead>
            <tbody className="divide-y divide-vintage-100">
              {assets.map((a, i) => (
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
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </VintageCard>
    </div>
  );
}
