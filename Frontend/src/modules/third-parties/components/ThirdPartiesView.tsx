'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Edit2, Trash2, Search, FileSpreadsheet, Download } from 'lucide-react';
import { exportThirdPartiesExcel, exportThirdPartiesPDF } from '@/lib/utils/export';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { FloatingInput } from '@/components/ui/floating-input';
import { StatusBadge, ConfirmDialog } from '@/components/ui/vintage-ui';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { useThirdParties } from '../hooks/useThirdParties';

interface ThirdParty { id: string; name: string; taxId: string; type: 'CUSTOMER' | 'SUPPLIER' | 'BOTH'; email: string; phone: string; balance: number; isActive: boolean; }

const typeLabels: Record<string, string> = { CUSTOMER: 'Cliente', SUPPLIER: 'Proveedor', BOTH: 'Ambos' };
const typeColors: Record<string, string> = { CUSTOMER: 'success', SUPPLIER: 'info', BOTH: 'warning' };

export function ThirdPartiesView() {
  const { parties = [], isLoading: loading, createParty, updateParty, deleteParty, isCreating, isUpdating, isDeleting } = useThirdParties() as any;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ThirdParty | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', taxId: '', type: 'CUSTOMER' as ThirdParty['type'], email: '', phone: '' });

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      toast.loading('Generando exportación...');
      const companyName = 'GANESHA Compañía Demo';
      if (format === 'excel') {
        await exportThirdPartiesExcel(parties, companyName);
      } else {
        await exportThirdPartiesPDF(parties, companyName);
      }
      toast.dismiss();
      toast.success(`Catálogo exportado en ${format.toUpperCase()}`);
    } catch {
      toast.dismiss();
      toast.error('Error al exportar catálogo');
    }
  };

  const filtered = parties.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.taxId.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || p.type === typeFilter;
    return matchSearch && matchType;
  });

  const openCreate = () => { setEditing(null); setForm({ name: '', taxId: '', type: 'CUSTOMER', email: '', phone: '' }); setShowForm(true); };
  const openEdit = (c: ThirdParty) => { setEditing(c); setForm({ name: c.name, taxId: c.taxId, type: c.type, email: c.email, phone: c.phone }); setShowForm(true); };
  
  const handleSave = async () => {
    if (!form.name || !form.taxId) { toast.error('Nombre y RUC son obligatorios'); return; }
    try {
      if (editing) {
        await updateParty({ id: editing.id, data: form });
      } else {
        await createParty(form);
      }
      setShowForm(false);
    } catch (err) {}
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteParty(deleteId);
        setDeleteId(null);
      } catch (err) {}
    }
  };

  const totalClients = parties.filter((p: any) => p.type === 'CUSTOMER' || p.type === 'BOTH').length;
  const totalSuppliers = parties.filter((p: any) => p.type === 'SUPPLIER' || p.type === 'BOTH').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-playfair font-bold text-vintage-900 dark:text-white">Terceros</h2>
            <p className="text-sm text-vintage-600 dark:text-zinc-400">Clientes, proveedores y acreedores</p>
          </div>
        </div>
        <div className="flex gap-2">
          <PastelButton variant="outline" onClick={() => handleExport('pdf')} className="gap-2">
            <Download className="w-4 h-4" /> PDF
          </PastelButton>
          <PastelButton variant="outline" onClick={() => handleExport('excel')} className="gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </PastelButton>
          <PastelButton onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nuevo Tercero</PastelButton>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <VintageCard><p className="text-xs text-vintage-500 uppercase tracking-wider font-bold">Total</p><p className="text-2xl font-playfair font-bold text-vintage-800 dark:text-white">{parties.length}</p></VintageCard>
        <VintageCard><p className="text-xs text-success uppercase tracking-wider font-bold">Clientes</p><p className="text-2xl font-playfair font-bold text-success">{totalClients}</p></VintageCard>
        <VintageCard><p className="text-xs text-info uppercase tracking-wider font-bold">Proveedores</p><p className="text-2xl font-playfair font-bold text-info">{totalSuppliers}</p></VintageCard>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vintage-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o RUC..." className="w-full pl-10 pr-4 py-2.5 text-sm bg-card border border-vintage-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2.5 text-sm bg-card border border-vintage-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400">
          <option value="">Todos los tipos</option>
          <option value="CUSTOMER">Clientes</option>
          <option value="SUPPLIER">Proveedores</option>
          <option value="BOTH">Ambos</option>
        </select>
      </div>

      <VintageCard className="p-0 overflow-hidden border-orange-500/10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-vintage-200 dark:border-white/5 bg-vintage-50/50 dark:bg-white/5">
                <th className="px-4 py-3 text-xs font-bold text-vintage-700 dark:text-zinc-400 text-left uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-xs font-bold text-vintage-700 dark:text-zinc-400 text-left uppercase tracking-wider">RUC</th>
                <th className="px-4 py-3 text-xs font-bold text-vintage-700 dark:text-zinc-400 text-center uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-xs font-bold text-vintage-700 dark:text-zinc-400 text-right uppercase tracking-wider">Saldo</th>
                <th className="px-4 py-3 text-xs font-bold text-vintage-700 dark:text-zinc-400 text-center uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-xs font-bold text-vintage-700 dark:text-zinc-400 text-center uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vintage-100 dark:divide-white/5">
              {filtered.map((p, i) => (
                <motion.tr key={p.id} className="hover:bg-vintage-50 dark:hover:bg-white/5 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td className="px-4 py-3"><div><p className="text-sm font-medium text-vintage-800 dark:text-white">{p.name}</p><p className="text-xs text-vintage-500 dark:text-zinc-500">{p.email}</p></div></td>
                  <td className="px-4 py-3"><span className="font-mono text-xs text-vintage-600 dark:text-zinc-400">{p.taxId}</span></td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={typeColors[p.type] as any} label={typeLabels[p.type]} /></td>
                  <td className={cn('px-4 py-3 text-sm text-right font-mono font-bold', p.balance > 0 ? 'text-success' : p.balance < 0 ? 'text-error' : 'text-vintage-600 dark:text-zinc-500')}>{formatCurrency(p.balance)}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={p.isActive ? 'success' : 'neutral'} label={p.isActive ? 'Activo' : 'Inactivo'} /></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-950/30 text-vintage-500 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-error/10 text-vintage-500 hover:text-error transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-vintage-500">No se encontraron terceros</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </VintageCard>

      {showForm && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowForm(false)} />
          <motion.div className="relative bg-card rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-vintage-200 dark:border-white/10" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}>
            <h3 className="text-xl font-playfair font-bold text-vintage-800 dark:text-white mb-6 underline decoration-orange-500/30">{editing ? 'Editar' : 'Nuevo'} Tercero</h3>
            <div className="space-y-4">
              <FloatingInput label="Nombre / Razón Social" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <FloatingInput label="RUC" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
              <div className="relative">
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ThirdParty['type'] })} className="peer w-full px-3 pt-5 pb-2 text-sm bg-card border border-vintage-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 appearance-none dark:text-white">
                  <option value="CUSTOMER">Cliente</option><option value="SUPPLIER">Proveedor</option><option value="BOTH">Ambos</option>
                </select>
                <label className="absolute left-3 top-1.5 text-xs text-vintage-500 font-bold uppercase tracking-tighter">Tipo</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FloatingInput label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <FloatingInput label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-vintage-100 dark:border-white/10">
              <button onClick={() => setShowForm(false)} className="px-6 py-2.5 text-sm font-bold rounded-xl border border-vintage-200 dark:border-white/10 text-vintage-700 dark:text-zinc-300 hover:bg-vintage-50 dark:hover:bg-white/5 transition-all">Cancelar</button>
              <PastelButton onClick={handleSave} loading={isCreating || isUpdating}>{editing ? 'Guardar Cambios' : 'Crear Tercero'}</PastelButton>
            </div>
          </motion.div>
        </motion.div>
      )}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Eliminar tercero" description="¿Está seguro de eliminar este tercero? Esta acción no se puede deshacer." variant="destructive" />
    </div>
  );
}
