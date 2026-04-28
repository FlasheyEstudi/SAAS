'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Lock, Unlock, Eye, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { StatusBadge, ConfirmDialog, EmptyState } from '@/components/ui/vintage-ui';
import { formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

import { usePeriods } from '../hooks/usePeriods';

const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

import { exportPeriodsExcel } from '@/lib/utils/export';
import { useAppStore } from '@/lib/stores/useAppStore';

export function PeriodsView() {
  const currentCompany = useAppStore(s => s.currentCompany);
  const { 
    periods = [], 
    isLoading: loading, 
    closePeriod, 
    reopenPeriod,
    createPeriod, 
    isClosing, 
    isReopening 
  } = usePeriods();

  const handleExport = async () => {
    if (!periods.length) return;
    toast.loading('Generando reporte...');
    await exportPeriodsExcel(periods, currentCompany?.name || 'GANESHA');
    toast.dismiss();
    toast.success('Historial de períodos exportado');
  };

  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'close' | 'reopen' } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPeriod, setNewPeriod] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });

  const handleClose = async () => {
    if (!confirmAction) return;
    try {
      await closePeriod(confirmAction.id);
      toast.success('Período cerrado exitosamente');
    } catch (err: any) {
      toast.error(err.error || 'Error al cerrar el período');
    } finally {
      setConfirmAction(null);
    }
  };

  const handleReopen = async () => {
    if (!confirmAction) return;
    try {
      await reopenPeriod(confirmAction.id);
      toast.success('Período reabierto exitosamente');
    } catch (err: any) {
      toast.error(err.error || 'Error al reabrir el período');
    } finally {
      setConfirmAction(null);
    }
  };

  const handleCreate = async () => {
    try {
      // We need companyId, usually from a context or global state
      // Assuming it's handled in the hook or we find it
      await createPeriod({ ...newPeriod, companyId: (periods[0] as any)?.companyId || '' });
      setShowCreateModal(false);
    } catch (err) {
      // Handled by hook
    }
  };

  const openPeriods = (periods || []).filter((p: any) => p.status === 'OPEN');
  const closedPeriods = (periods || []).filter((p: any) => p.status === 'CLOSED');

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-vintage-900">Períodos Contables</h2>
          <p className="text-sm text-vintage-600 mt-1">Gestión de períodos fiscales</p>
        </div>
        <div className="flex gap-2">
          <PastelButton variant="outline" onClick={handleExport} className="gap-2">
            <CalendarDays className="w-4 h-4" />
            Exportar Excel
          </PastelButton>
          <PastelButton onClick={() => setShowCreateModal(true)}><Plus className="w-4 h-4 mr-2" />Nuevo Período</PastelButton>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <VintageCard><p className="text-xs text-vintage-500">Total</p><p className="text-2xl font-bold text-vintage-800">{periods.length}</p></VintageCard>
        <VintageCard><p className="text-xs text-vintage-500">Abiertos</p><p className="text-2xl font-bold text-success">{openPeriods.length}</p></VintageCard>
        <VintageCard><p className="text-xs text-vintage-500">Cerrados</p><p className="text-2xl font-bold text-vintage-600">{closedPeriods.length}</p></VintageCard>
      </div>

      {/* Period grid - calendar-like */}
      <VintageCard>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {(periods || []).map((period: any, i: number) => (
              <motion.div
                key={period.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  'rounded-xl p-3 border transition-all hover:shadow-md cursor-pointer',
                  period.status === 'OPEN' ? 'bg-success/5 border-success/30 hover:border-success/50' :
                  period.status === 'CLOSED' ? 'bg-vintage-50 border-vintage-200 opacity-75' : 'bg-error/5 border-error/20'
                )}
                onClick={() => {
                  if (period.status === 'OPEN') setConfirmAction({ id: period.id, action: 'close' });
                  else if (period.status === 'CLOSED') setConfirmAction({ id: period.id, action: 'reopen' });
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-vintage-800">{period.month}</span>
                  {period.status === 'OPEN' ? <Unlock className="w-3.5 h-3.5 text-success" /> : <Lock className="w-3.5 h-3.5 text-vintage-400" />}
                </div>
                <p className="text-xs font-medium text-vintage-700">{months[period.month - 1]}</p>
                <p className="text-[10px] text-vintage-500 mt-0.5">{period.entryCount || 0} pólizas</p>
                <StatusBadge status={period.status === 'OPEN' ? 'success' : period.status === 'CLOSED' ? 'neutral' : 'error'} label={period.status === 'OPEN' ? 'Abierto' : 'Cerrado'} />
              </motion.div>
            ))}
        </div>
      </VintageCard>

      {/* List view */}
      <VintageCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-vintage-200 bg-vintage-50/50">
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Período</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Inicio</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Fin</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center">Pólizas</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vintage-100">
              {(periods || []).map((p: any) => (
                <tr key={p.id} className="hover:bg-vintage-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-vintage-800">{p.name}</td>
                  <td className="px-4 py-3 text-xs text-vintage-600">{formatDate(p.startDate)}</td>
                  <td className="px-4 py-3 text-xs text-vintage-600">{formatDate(p.endDate)}</td>
                  <td className="px-4 py-3 text-sm text-vintage-700 text-center">{p.entryCount || 0}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={p.status === 'OPEN' ? 'success' : 'neutral'} label={p.status === 'OPEN' ? 'Abierto' : 'Cerrado'} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.status === 'OPEN' ? (
                      <PastelButton variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: p.id, action: 'close' }); }}>Cerrar</PastelButton>
                    ) : (
                      <PastelButton variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: p.id, action: 'reopen' }); }}>Reabrir</PastelButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </VintageCard>

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={confirmAction?.action === 'close' ? handleClose : handleReopen}
        title={confirmAction?.action === 'close' ? 'Cerrar Período' : 'Reabrir Período'}
        description={confirmAction?.action === 'close' ? '¿Cerrar este período? No se podrán crear nuevas pólizas.' : '¿Reabrir este período? Se permitirá la captura de pólizas.'}
      />

      <ConfirmDialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleCreate}
        title="Nuevo Período Contable"
        description="Seleccione el mes y año para el nuevo período."
      >
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-vintage-600 ml-1">Año</label>
            <input type="number" value={newPeriod.year} onChange={e => setNewPeriod({ ...newPeriod, year: parseInt(e.target.value) })} className="w-full px-3 py-2 text-sm bg-vintage-50 border border-vintage-200 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-vintage-600 ml-1">Mes</label>
            <select value={newPeriod.month} onChange={e => setNewPeriod({ ...newPeriod, month: parseInt(e.target.value) })} className="w-full px-3 py-2 text-sm bg-vintage-50 border border-vintage-200 rounded-xl">
              {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
