'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Search, Edit2, Trash2, Tag, Layers } from 'lucide-react';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { FloatingInput } from '@/components/ui/floating-input';
import { StatusBadge, ConfirmDialog } from '@/components/ui/vintage-ui';
import { useFinancialConcepts, FinancialConcept } from '../hooks/useFinancialConcepts';
import { useAccounts } from '@/modules/accounts/hooks/useAccounts';
import { useCostCenters } from '@/modules/cost-centers/hooks/useCostCenters';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { exportConceptsExcel } from '@/lib/utils/export';
import { useAppStore } from '@/lib/stores/useAppStore';

export function FinancialConceptsView() {
  const currentCompany = useAppStore(s => s.currentCompany);
  const { concepts, isLoading, createConcept, updateConcept, deleteConcept, isCreating, isUpdating } = useFinancialConcepts();

  const handleExport = async () => {
    if (!concepts.length) return;
    try {
      toast.loading('Generando reporte...', { id: 'export-loading', duration: 8000 });
      await exportConceptsExcel(concepts, currentCompany?.name || 'GANESHA');
      toast.success('Catálogo de conceptos exportado', { id: 'export-loading' });
    } catch {
      toast.error('Error al exportar conceptos', { id: 'export-loading' });
    }
  };
  const { accounts } = useAccounts();
  const { costCenters } = useCostCenters();
  
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FinancialConcept | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [form, setForm] = useState<Partial<FinancialConcept>>({
    code: '',
    name: '',
    category: 'OTRO',
    defaultAccountId: '',
    defaultCostCenterId: '',
    isActive: true
  });

  const filtered = concepts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', name: '', category: 'OTRO', defaultAccountId: '', defaultCostCenterId: '', isActive: true });
    setShowForm(true);
  };

  const openEdit = (c: FinancialConcept) => {
    setEditing(c);
    setForm({ 
      code: c.code, 
      name: c.name, 
      category: c.category, 
      defaultAccountId: c.defaultAccountId || '', 
      defaultCostCenterId: c.defaultCostCenterId || '', 
      isActive: c.isActive 
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.name) {
      toast.error('Código y nombre son obligatorios');
      return;
    }
    
    if (editing) {
      await updateConcept({ id: editing.id, data: form });
    } else {
      await createConcept(form);
    }
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteConcept(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-vintage-900">Conceptos Financieros</h2>
          <p className="text-sm text-vintage-600 mt-1">Definición de conceptos operativos con asignación contable automática</p>
        </div>
        <div className="flex gap-2">
          <PastelButton variant="outline" onClick={handleExport} className="gap-2">
            <BookOpen className="w-4 h-4" />
            Exportar Excel
          </PastelButton>
          <PastelButton onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nuevo Concepto</PastelButton>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vintage-400" />
        <input 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Buscar concepto por código o nombre..." 
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 shadow-sm" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <VintageCard className="h-full flex flex-col border-vintage-200 hover:border-vintage-400 transition-colors group">
              <div className="flex justify-between items-start mb-3">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-vintage-100 text-vintage-600 rounded uppercase tracking-wider">{c.code}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-vintage-100 text-vintage-500"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:bg-error/10 text-vintage-500 hover:text-error"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              
              <h3 className="text-base font-bold text-vintage-800 mb-1">{c.name}</h3>
              <div className="flex items-center gap-2 mb-4">
                <StatusBadge status="info" label={c.category} size="xs" />
                <StatusBadge status={c.isActive ? 'success' : 'neutral'} label={c.isActive ? 'Activo' : 'Inactivo'} size="xs" />
              </div>

              <div className="mt-auto pt-3 border-t border-vintage-100 space-y-2">
                <div className="flex items-center gap-2 text-xs text-vintage-500">
                  <Tag className="w-3 h-3" />
                  <span className="truncate">{c.account ? `${c.account.code} - ${c.account.name}` : 'Sin cuenta contable'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-vintage-500">
                  <Layers className="w-3 h-3" />
                  <span className="truncate">{c.costCenter ? `${c.costCenter.code} - ${c.costCenter.name}` : 'Sin centro de costo'}</span>
                </div>
              </div>
            </VintageCard>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center flex flex-col items-center">
            <BookOpen className="w-12 h-12 text-vintage-200 mb-4" />
            <p className="text-vintage-500 font-medium">No se encontraron conceptos financieros</p>
          </div>
        )}
      </div>

      {showForm && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" onClick={() => setShowForm(false)} />
          <motion.div className="relative bg-card rounded-2xl p-6 max-w-lg w-full shadow-xl border border-vintage-200" initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
            <h3 className="text-lg font-playfair font-bold text-vintage-800 mb-4">{editing ? 'Editar' : 'Nuevo'} Concepto</h3>
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <FloatingInput label="Código (ej: SER-PROF)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                 <div className="relative">
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })} className="peer w-full px-3 pt-5 pb-2 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 appearance-none">
                      {['NOMINA', 'SERVICIO', 'IMPUESTO', 'ANTICIPO', 'TRASPASO', 'AJUSTE', 'OTRO'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <label className="absolute left-3 top-1.5 text-xs text-vintage-500 font-medium pointer-events-none">Categoría</label>
                  </div>
               </div>
              <FloatingInput label="Nombre del Concepto" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              
              <div className="space-y-4 pt-2">
                <div className="relative">
                  <select value={form.defaultAccountId} onChange={(e) => setForm({ ...form, defaultAccountId: e.target.value })} className="peer w-full px-3 pt-5 pb-2 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 appearance-none">
                    <option value="">Ninguna</option>
                    {(Array.isArray(accounts) ? accounts : []).map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                    ))}
                  </select>
                  <label className="absolute left-3 top-1.5 text-xs text-vintage-500 font-medium pointer-events-none">Cuenta Contable por Defecto</label>
                </div>

                <div className="relative">
                  <select value={form.defaultCostCenterId} onChange={(e) => setForm({ ...form, defaultCostCenterId: e.target.value })} className="peer w-full px-3 pt-5 pb-2 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 appearance-none">
                    <option value="">Ninguno</option>
                    {(Array.isArray(costCenters) ? costCenters : []).map(cc => (
                      <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
                    ))}
                  </select>
                  <label className="absolute left-3 top-1.5 text-xs text-vintage-500 font-medium pointer-events-none">Centro de Costo por Defecto</label>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded text-vintage-600 focus:ring-vintage-400 border-vintage-300" />
                <span className="text-sm text-vintage-700 font-medium">Concepto Activo</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-vintage-100">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-xl border border-vintage-200 text-vintage-700 hover:bg-vintage-50">Cancelar</button>
              <PastelButton onClick={handleSave} loading={isCreating || isUpdating}>{editing ? 'Guardar Cambios' : 'Crear Concepto'}</PastelButton>
            </div>
          </motion.div>
        </motion.div>
      )}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Eliminar Concepto" description="¿Está seguro de eliminar este concepto? Otros módulos que dependan de él podrían verse afectados." variant="destructive" />
    </div>
  );
}
