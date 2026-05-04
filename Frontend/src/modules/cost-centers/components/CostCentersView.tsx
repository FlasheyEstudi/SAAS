'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { FloatingInput } from '@/components/ui/floating-input';
import { StatusBadge, ConfirmDialog } from '@/components/ui/vintage-ui';

import { useCostCenters } from '../hooks/useCostCenters';

import { exportCostCentersExcel } from '@/lib/utils/export';
import { useAppStore } from '@/lib/stores/useAppStore';

export function CostCentersView() {
  const currentCompany = useAppStore(s => s.currentCompany);
  const { 
    costCenters: centers = [], 
    isLoading: loading,
    createCostCenter,
    updateCostCenter,
    deleteCostCenter,
    isCreating,
    isUpdating
  } = useCostCenters();

  const handleExport = async () => {
    if (!centers.length) return;
    toast.loading('Generando reporte...', { id: 'export-loading', duration: 8000 });
    await exportCostCentersExcel(centers, currentCompany?.name || 'GANESHA');
    toast.dismiss(toastId);
    toast.success('Catálogo de centros de costo exportado');
  };

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', name: '', description: '' });

  const openCreate = () => { setEditing(null); setForm({ code: '', name: '', description: '' }); setShowForm(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ code: c.code, name: c.name, description: c.description || '' }); setShowForm(true); };
  
  const handleSave = async () => {
    if (!form.code || !form.name) { toast.error('Código y nombre son obligatorios'); return; }
    
    try {
      if (editing) {
        await updateCostCenter({ id: editing.id, data: form });
      } else {
        await createCostCenter(form);
      }
      setShowForm(false);
    } catch (err) {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => { 
    if (deleteId) { 
      try {
        await deleteCostCenter(deleteId);
        setDeleteId(null);
      } catch (err) {
        // Error handled by mutation
      }
    } 
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-playfair font-bold text-vintage-900">Centros de Costo</h2><p className="text-sm text-vintage-600 mt-1">Gestión de centros de coste y departamentos</p></div>
        <div className="flex gap-2">
          <PastelButton variant="outline" onClick={handleExport}><Target className="w-4 h-4 mr-2" />Exportar Excel</PastelButton>
          <PastelButton onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nuevo Centro</PastelButton>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <VintageCard><p className="text-xs text-vintage-500">Total</p><p className="text-2xl font-bold text-vintage-800">{(centers || []).length}</p></VintageCard>
        <VintageCard><p className="text-xs text-vintage-500">Activos</p><p className="text-2xl font-bold text-success">{(centers || []).filter(c => c.isActive).length}</p></VintageCard>
        <VintageCard><p className="text-xs text-vintage-500">Total Pólizas</p><p className="text-2xl font-bold text-vintage-800">{(centers || []).reduce((s, c) => s + (Number(c.journalEntryCount) || 0), 0)}</p></VintageCard>
      </div>

      <VintageCard className="p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-vintage-200 bg-vintage-50/50">
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Código</th>
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Nombre</th>
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Descripción</th>
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center">Pólizas</th>
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center">Estado</th>
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vintage-100">
            {(centers || []).map((c, i) => (
              <motion.tr key={c.id} className="hover:bg-vintage-50 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                <td className="px-4 py-3"><span className="font-mono text-sm font-medium text-vintage-700 bg-vintage-100 px-2 py-0.5 rounded">{c.code}</span></td>
                <td className="px-4 py-3 text-sm font-medium text-vintage-800">{c.name}</td>
                <td className="px-4 py-3 text-xs text-vintage-600">{c.description}</td>
                <td className="px-4 py-3 text-sm text-vintage-700 text-center">{c.journalEntryCount || 0}</td>
                <td className="px-4 py-3 text-center"><StatusBadge status={c.isActive ? 'success' : 'neutral'} label={c.isActive ? 'Activo' : 'Inactivo'} /></td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-vintage-100 text-vintage-500 hover:text-vintage-700"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:bg-error/10 text-vintage-500 hover:text-error"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </VintageCard>

      {showForm && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <motion.div className="relative bg-card rounded-2xl p-6 max-w-md w-full shadow-xl border border-vintage-200" initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
            <h3 className="text-lg font-playfair font-bold text-vintage-800 mb-4">{editing ? 'Editar' : 'Nuevo'} Centro de Costo</h3>
            <div className="space-y-4">
              <FloatingInput label="Código" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              <FloatingInput label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <FloatingInput label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-xl border border-vintage-200 text-vintage-700 hover:bg-vintage-50">Cancelar</button>
              <PastelButton onClick={handleSave}>{editing ? 'Guardar' : 'Crear'}</PastelButton>
            </div>
          </motion.div>
        </motion.div>
      )}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Eliminar centro" description="¿Eliminar este centro de costo?" variant="destructive" />
    </div>
  );
}
