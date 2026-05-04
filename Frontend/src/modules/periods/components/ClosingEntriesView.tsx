'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Play, History, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { StatusBadge, ConfirmDialog } from '@/components/ui/vintage-ui';
import { useClosingEntries, ClosingEntry } from '../hooks/useClosingEntries';
import { usePeriods } from '../hooks/usePeriods';
import { formatCurrency, formatDate } from '@/lib/utils/format';

import { exportClosingEntriesExcel } from '@/lib/utils/export';
import { useAppStore } from '@/lib/stores/useAppStore';

export function ClosingEntriesView() {
  const currentCompany = useAppStore(s => s.currentCompany);
  const { entries, isLoading, generateClosing, deleteClosing, isGenerating } = useClosingEntries();

  const handleExport = async () => {
    if (!entries.length) return;
    toast.loading('Generando reporte...', { id: 'export-loading', duration: 8000 });
    await exportClosingEntriesExcel(entries, currentCompany?.name || 'GANESHA');
    toast.dismiss(toastId);
    toast.success('Historial de cierres exportado');
  };
  const { periods } = usePeriods();
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [closingType, setClosingType] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedPeriod) return;
    await generateClosing({ periodId: selectedPeriod, type: closingType });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteClosing(deleteId);
      setDeleteId(null);
    }
  };

  const openPeriods = periods.filter(p => p.status === 'OPEN');

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-vintage-900">Cierre de Períodos</h2>
          <p className="text-sm text-vintage-600 mt-1">Generación de asientos de cierre y bloqueo de períodos contables</p>
        </div>
        <div className="flex gap-2">
          <PastelButton variant="outline" onClick={handleExport} className="gap-2">
            <History className="w-4 h-4" />
            Exportar Excel
          </PastelButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selection Card */}
        <VintageCard className="lg:col-span-1">
          <h3 className="text-lg font-bold text-vintage-800 mb-4 flex items-center gap-2">
            <Play className="w-4 h-4 text-vintage-500" />
            Nuevo Cierre
          </h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-vintage-500 ml-1">Seleccionar Período</label>
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400"
              >
                <option value="">Seleccione un período abierto...</option>
                {openPeriods.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.year})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-vintage-500 ml-1">Tipo de Cierre</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setClosingType('MONTHLY')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                    closingType === 'MONTHLY' 
                      ? 'bg-vintage-800 text-white border-vintage-800' 
                      : 'bg-white text-vintage-500 border-vintage-200 hover:border-vintage-400'
                  }`}
                >
                  Mensual
                </button>
                <button 
                  onClick={() => setClosingType('ANNUAL')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                    closingType === 'ANNUAL' 
                      ? 'bg-vintage-800 text-white border-vintage-800' 
                      : 'bg-white text-vintage-500 border-vintage-200 hover:border-vintage-400'
                  }`}
                >
                  Anual (Liquidación)
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Generar un cierre cancelará las cuentas de resultados (Ingresos/Gastos) y trasladará el saldo a la utilidad/pérdida del período. El período se bloqueará para nuevas pólizas.
              </p>
            </div>

            <PastelButton 
              className="w-full" 
              onClick={handleGenerate} 
              disabled={!selectedPeriod || isGenerating}
              loading={isGenerating}
            >
              Generar Asiento de Cierre
            </PastelButton>
          </div>
        </VintageCard>

        {/* History Card */}
        <VintageCard className="lg:col-span-2 p-0 overflow-hidden">
          <div className="p-4 border-b border-vintage-100 flex items-center gap-2">
            <History className="w-4 h-4 text-vintage-500" />
            <h3 className="text-sm font-bold text-vintage-800">Historial de Cierres</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-vintage-200 bg-vintage-50/50">
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Fecha</th>
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Descripción</th>
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-right">Débitos</th>
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-right">Créditos</th>
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vintage-100">
                {entries.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-vintage-500">No se han generado asientos de cierre</td></tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-vintage-50">
                      <td className="px-4 py-3 text-sm text-vintage-600">{formatDate(entry.createdAt)}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-vintage-800">{entry.description}</p>
                        <p className="text-[10px] text-vintage-400 uppercase tracking-tighter">{entry.entryType}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(entry.totalDebit)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(entry.totalCredit)}</td>
                      <td className="px-4 py-3 text-center">
                        <button 
                          onClick={() => setDeleteId(entry.id)}
                          className="p-1.5 rounded-lg hover:bg-error/10 text-vintage-400 hover:text-error transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </VintageCard>
      </div>

      <ConfirmDialog 
        open={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDelete} 
        title="Revertir Cierre" 
        description="¿Está seguro de eliminar este asiento de cierre? El período se mantendrá cerrado pero el asiento contable será eliminado. Es recomendable reabrir el período manualmente."
        variant="destructive"
      />
    </div>
  );
}
