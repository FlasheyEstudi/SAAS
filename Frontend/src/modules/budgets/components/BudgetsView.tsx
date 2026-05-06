'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PiggyBank, BarChart3, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { StatusBadge, ConfirmDialog, EmptyState } from '@/components/ui/vintage-ui';
import { PastelButton } from '@/components/ui/pastel-button';
import { AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

import { useBudgets } from '../hooks/useBudgets';
import { exportBudgetsExcel } from '@/lib/utils/export';
import { useAppStore } from '@/lib/stores/useAppStore';

const statusColors: Record<string, string> = { DRAFT: 'neutral', APPROVED: 'info', ACTIVE: 'success', CLOSED: 'warning' };
const statusLabels: Record<string, string> = { DRAFT: 'Borrador', APPROVED: 'Aprobado', ACTIVE: 'Activo', CLOSED: 'Cerrado' };

export function BudgetsView() {
  const { budgets = [], isLoading: loading, createBudget, updateBudget, deleteBudget, isCreating, isUpdating, isDeleting } = useBudgets() as any;
  const currentCompany = useAppStore(s => s.currentCompany);
  const [selected, setSelected] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', totalBudgeted: 0 });

  const handleExport = async () => {
    if (!budget) return;
    try {
      const companyName = currentCompany?.name || 'GANESHA';
      toast.loading('Generando reporte...', { id: 'export-loading', duration: 8000 });
      await exportBudgetsExcel(budget, companyName);
      toast.success('Presupuesto exportado a Excel', { id: 'export-loading' });
    } catch (error) {
      toast.error('Error al exportar presupuesto', { id: 'export-loading' });
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  const budget = selected || budgets[0];



  if (!budget && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h2 className="text-2xl font-playfair font-bold text-vintage-900">Presupuestos</h2><p className="text-sm text-vintage-600 mt-1">Comparación presupuesto vs real</p></div>
          <PastelButton onClick={() => setShowModal(true)}><Plus className="w-4 h-4 mr-2" />Nuevo Presupuesto</PastelButton>
        </div>
        <div className="py-24 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-vintage-100 mb-4 text-vintage-400"><PiggyBank className="w-8 h-8" /></div>
          <h3 className="text-lg font-playfair font-bold text-vintage-800">No hay presupuestos todavía</h3>
          <p className="text-vintage-500 mb-6">Comienza creando tu primer presupuesto para el periodo actual.</p>
          <PastelButton onClick={() => setShowModal(true)}>Crear mi primer presupuesto</PastelButton>
        </div>
        {renderModal()}
      </div>
    );
  }

  function handleSave() {
    if (!formData.name) { toast.error('Ingresa un nombre'); return; }
    if (isEditing && selected) {
      updateBudget({ id: selected.id, data: formData }, {
        onSuccess: () => setShowModal(false)
      });
    } else {
      createBudget(formData, {
        onSuccess: () => setShowModal(false)
      });
    }
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteBudget(deleteId, {
      onSuccess: () => {
        setDeleteId(null);
        if (selected?.id === deleteId) setSelected(null);
      }
    });
  }

  function renderModal() {
    return (
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-vintage-200" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="p-6 border-b border-vintage-100 flex items-center justify-between">
                <h3 className="text-lg font-playfair font-bold text-vintage-800">{isEditing ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</h3>
                <button onClick={() => setShowModal(false)} className="text-vintage-400 p-1 hover:bg-vintage-50 rounded-lg">×</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-vintage-600 ml-1">Nombre</label>
                  <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-vintage-600 ml-1">Monto Total (NIO)</label>
                  <input type="number" value={formData.totalBudgeted} onChange={e => setFormData({ ...formData, totalBudgeted: parseFloat(e.target.value) })} className="w-full px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-vintage-600 ml-1">Descripción</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl min-h-[100px] focus:outline-none focus:ring-2 focus:ring-vintage-400" />
                </div>
              </div>
              <div className="p-6 bg-vintage-50/50 flex justify-end gap-3 rounded-b-2xl">
                <PastelButton variant="outline" onClick={() => setShowModal(false)}>Cancelar</PastelButton>
                <PastelButton onClick={handleSave} loading={isCreating || isUpdating}>{isEditing ? 'Guardar Cambios' : 'Crear'}</PastelButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const pctUsed = budget.totalBudgeted > 0 ? ((budget.totalActual / budget.totalBudgeted) * 100) : 0;
  const variance = budget.totalBudgeted - budget.totalActual;

  const chartData = (budget.lines || []).map((l: any) => ({ name: l.account?.name || l.accountId || 'Cuenta', Presupuestado: l.budgetedAmount || 0, Real: l.actualAmount || 0 }));


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-playfair font-bold text-vintage-900">Presupuestos</h2><p className="text-sm text-vintage-600 mt-1">Comparación presupuesto vs real</p></div>
        <div className="flex gap-2">
          <PastelButton variant="outline" size="sm" onClick={handleExport}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Exportar Excel
          </PastelButton>
          <PastelButton variant="outline" size="sm" onClick={() => {
            if (!budget) return;
            setFormData({ name: budget.name, description: budget.description || '', totalBudgeted: budget.totalBudgeted });
            setIsEditing(true);
            setShowModal(true);
          }}>
            <Edit2 className="w-3.5 h-3.5 mr-2" />
            Editar
          </PastelButton>
          <PastelButton variant="secondary" size="sm" onClick={() => setDeleteId(budget?.id)}>
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Eliminar
          </PastelButton>
          <PastelButton onClick={() => {
            setFormData({ name: '', description: '', totalBudgeted: 0 });
            setIsEditing(false);
            setShowModal(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Presupuesto
          </PastelButton>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {budgets.map(b => (
          <button key={b.id} onClick={() => setSelected(b)} className={`px-4 py-2 text-sm rounded-xl whitespace-nowrap transition-all ${selected?.id === b.id ? 'bg-vintage-400 text-white shadow-sm' : 'bg-vintage-100 text-vintage-700 hover:bg-vintage-200'}`}>
            {b.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <VintageCard><p className="text-xs text-vintage-500">Presupuestado</p><p className="text-xl font-bold text-vintage-800">{formatCurrency(budget.totalBudgeted)}</p></VintageCard>
        <VintageCard><p className="text-xs text-vintage-500">Ejecutado</p><p className="text-xl font-bold text-info">{formatCurrency(budget.totalActual)}</p></VintageCard>
        <VintageCard><p className="text-xs text-vintage-500">Variación</p><p className={cn('text-xl font-bold', variance >= 0 ? 'text-success' : 'text-error')}>{formatCurrency(Math.abs(variance))}</p></VintageCard>
        <VintageCard>
          <p className="text-xs text-vintage-500">% Ejecutado</p>
          <div className="flex items-end gap-2">
            <p className="text-xl font-bold text-vintage-800">{pctUsed.toFixed(1)}%</p>
            <div className="flex-1 h-2 bg-vintage-100 rounded-full overflow-hidden"><motion.div className="h-full rounded-full bg-vintage-400" initial={{ width: 0 }} animate={{ width: `${Math.min(pctUsed, 100)}%` }} transition={{ duration: 0.8 }} /></div>
          </div>
          <StatusBadge status={statusColors[budget.status] as any} label={statusLabels[budget.status]} />
        </VintageCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VintageCard>
          <h3 className="text-sm font-semibold text-vintage-800 mb-4">Presupuesto vs Real</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#C9A9A6' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#C9A9A6' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: '#FFF5F7', border: '1px solid #FFE4E8', borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="Presupuestado" fill="#FFB6C1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Real" fill="#86C1A5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </VintageCard>

        <VintageCard className="p-0 overflow-hidden">
          <div className="px-5 pt-5 pb-3"><h3 className="text-sm font-semibold text-vintage-800">Detalle por Cuenta</h3></div>
          <table className="w-full">
            <thead><tr className="border-b border-vintage-200 bg-vintage-50/50"><th className="px-4 py-2 text-xs font-semibold text-vintage-700 text-left">Cuenta</th><th className="px-4 py-2 text-xs font-semibold text-vintage-700 text-right">Presup.</th><th className="px-4 py-2 text-xs font-semibold text-vintage-700 text-right">Real</th><th className="px-4 py-2 text-xs font-semibold text-vintage-700 text-right">Var.</th></tr></thead>
            <tbody className="divide-y divide-vintage-100">
              {(budget.lines || []).map((l: any, i: number) => {
                const v = (l.budgetedAmount || 0) - (l.actualAmount || 0);
                return (
                  <motion.tr key={i} className="hover:bg-vintage-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <td className="px-4 py-2.5 text-sm text-vintage-700">{l.account?.name || l.accountId || 'Cuenta'}</td>
                    <td className="px-4 py-2.5 text-sm text-vintage-600 text-right font-mono">{formatCurrency(l.budgetedAmount || 0)}</td>
                    <td className="px-4 py-2.5 text-sm text-vintage-600 text-right font-mono">{formatCurrency(l.actualAmount || 0)}</td>
                    <td className={cn('px-4 py-2.5 text-sm text-right font-mono', v >= 0 ? 'text-success' : 'text-error')}>{formatCurrency(Math.abs(v))}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </VintageCard>
      </div>
      {renderModal()}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Presupuesto"
        description="¿Estás seguro de que deseas eliminar este presupuesto? Esta acción no se puede deshacer."
        loading={isDeleting}
      />
    </div>
  );
}
