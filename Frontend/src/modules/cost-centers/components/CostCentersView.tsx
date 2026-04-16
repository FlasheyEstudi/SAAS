'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { FloatingInput } from '@/components/ui/floating-input';
import { StatusBadge, ConfirmDialog } from '@/components/ui/vintage-ui';

interface CostCenter { id: string; code: string; name: string; description: string; isActive: boolean; entryCount: number; }

const mockCenters: CostCenter[] = [
  { id: '1', code: 'ADM', name: 'Administración', description: 'Gastos administrativos generales', isActive: true, entryCount: 85 },
  { id: '2', code: 'CON', name: 'Contabilidad', description: 'Departamento contable', isActive: true, entryCount: 120 },
  { id: '3', code: 'VEN', name: 'Ventas', description: 'Departamento comercial', isActive: true, entryCount: 64 },
  { id: '4', code: 'OPE', name: 'Operaciones', description: 'Área de operaciones y producción', isActive: true, entryCount: 95 },
  { id: '5', code: 'FIN', name: 'Finanzas', description: 'Departamento financiero', isActive: true, entryCount: 45 },
  { id: '6', code: 'RH', name: 'Recursos Humanos', description: 'Gestión de personal', isActive: true, entryCount: 32 },
  { id: '7', code: 'TI', name: 'Tecnología', description: 'Sistemas y soporte técnico', isActive: false, entryCount: 18 },
  { id: '8', code: 'MKT', name: 'Marketing', description: 'Publicidad y promoción', isActive: true, entryCount: 27 },
];

export function CostCentersView() {
  const [centers, setCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CostCenter | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', name: '', description: '' });

  useEffect(() => { setTimeout(() => { setCenters(mockCenters); setLoading(false); }, 500); }, []);

  const openCreate = () => { setEditing(null); setForm({ code: '', name: '', description: '' }); setShowForm(true); };
  const openEdit = (c: CostCenter) => { setEditing(c); setForm({ code: c.code, name: c.name, description: c.description }); setShowForm(true); };
  const handleSave = () => {
    if (!form.code || !form.name) { toast.error('Código y nombre son obligatorios'); return; }
    if (editing) { setCenters(prev => prev.map(c => c.id === editing.id ? { ...c, ...form } : c)); toast.success('Centro actualizado'); }
    else { setCenters(prev => [...prev, { id: Date.now().toString(), ...form, isActive: true, entryCount: 0 }]); toast.success('Centro creado'); }
    setShowForm(false);
  };
  const handleDelete = () => { if (deleteId) { setCenters(prev => prev.filter(c => c.id !== deleteId)); toast.success('Centro eliminado'); setDeleteId(null); } };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-playfair font-bold text-vintage-900">Centros de Costo</h2><p className="text-sm text-vintage-600 mt-1">Gestión de centros de coste y departamentos</p></div>
        <PastelButton onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nuevo Centro</PastelButton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <VintageCard><p className="text-xs text-vintage-500">Total</p><p className="text-2xl font-bold text-vintage-800">{centers.length}</p></VintageCard>
        <VintageCard><p className="text-xs text-vintage-500">Activos</p><p className="text-2xl font-bold text-success">{centers.filter(c => c.isActive).length}</p></VintageCard>
        <VintageCard><p className="text-xs text-vintage-500">Total Pólizas</p><p className="text-2xl font-bold text-vintage-800">{centers.reduce((s, c) => s + c.entryCount, 0)}</p></VintageCard>
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
            {centers.map((c, i) => (
              <motion.tr key={c.id} className="hover:bg-vintage-50 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                <td className="px-4 py-3"><span className="font-mono text-sm font-medium text-vintage-700 bg-vintage-100 px-2 py-0.5 rounded">{c.code}</span></td>
                <td className="px-4 py-3 text-sm font-medium text-vintage-800">{c.name}</td>
                <td className="px-4 py-3 text-xs text-vintage-600">{c.description}</td>
                <td className="px-4 py-3 text-sm text-vintage-700 text-center">{c.entryCount}</td>
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
