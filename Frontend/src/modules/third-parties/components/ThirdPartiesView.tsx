'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { FloatingInput } from '@/components/ui/floating-input';
import { StatusBadge, ConfirmDialog, EmptyState } from '@/components/ui/vintage-ui';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

interface ThirdParty { id: string; name: string; taxId: string; type: 'CLIENT' | 'SUPPLIER' | 'BOTH'; email: string; phone: string; balance: number; isActive: boolean; }

const mockThirdParties: ThirdParty[] = [
  { id: '1', name: 'Grupo Alfa S.A. de C.V.', taxId: 'GA180101XYZ', type: 'CLIENT', email: 'pagos@grupoalfa.mx', phone: '+52 999 111 2233', balance: 185000, isActive: true },
  { id: '2', name: 'Inmobiliaria del Golfo', taxId: 'IDG160202ABC', type: 'CLIENT', email: 'cxc@inmgolfo.mx', phone: '+52 938 444 5566', balance: 95000, isActive: true },
  { id: '3', name: 'Ferremateriales López', taxId: 'FL200303DEF', type: 'SUPPLIER', email: 'ventas@ferrelopez.mx', phone: '+52 969 777 8899', balance: -62000, isActive: true },
  { id: '4', name: 'Servicios Profesionales García', taxId: 'SPG170404GHI', type: 'SUPPLIER', email: 'contacto@spgarcia.mx', phone: '+52 999 222 3344', balance: -45000, isActive: true },
  { id: '5', name: 'Constructora del Norte S.A.', taxId: 'CDN190505JKL', type: 'BOTH', email: 'finance@cdnorte.mx', phone: '+52 831 333 4455', balance: 120000, isActive: true },
  { id: '6', name: 'Papelería Central', taxId: 'PC210606MNO', type: 'SUPPLIER', email: 'pedidos@papcentral.mx', phone: '+52 999 555 6677', balance: -12000, isActive: true },
  { id: '7', name: 'Hotel Paraíso Riviera', taxId: 'HPR220707PQR', type: 'CLIENT', email: 'admon@hotelparaiso.mx', phone: '+52 984 888 9900', balance: 250000, isActive: true },
  { id: '8', name: 'Transportes Unidos de Yucatán', taxId: 'TUY230808STU', type: 'SUPPLIER', email: 'facturacion@tuy.mx', phone: '+52 999 666 7788', balance: -85000, isActive: false },
  { id: '9', name: 'Clínica Dental Sonrisa', taxId: 'CDS240909VWX', type: 'CLIENT', email: 'pagos@clinicasonrisa.mx', phone: '+52 999 444 1122', balance: 35000, isActive: true },
  { id: '10', name: 'Distribuidora de Bebidas del Sur', taxId: 'DBS251010YZA', type: 'CLIENT', email: 'cuentas@dbdsur.mx', phone: '+52 986 999 0011', balance: 175000, isActive: true },
];

const typeLabels: Record<string, string> = { CLIENT: 'Cliente', SUPPLIER: 'Proveedor', BOTH: 'Ambos' };
const typeColors: Record<string, string> = { CLIENT: 'success', SUPPLIER: 'info', BOTH: 'warning' };

export function ThirdPartiesView() {
  const [parties, setParties] = useState<ThirdParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ThirdParty | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', taxId: '', type: 'CLIENT' as ThirdParty['type'], email: '', phone: '' });

  useEffect(() => { setTimeout(() => { setParties(mockThirdParties); setLoading(false); }, 500); }, []);

  const filtered = parties.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.taxId.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || p.type === typeFilter;
    return matchSearch && matchType;
  });

  const openCreate = () => { setEditing(null); setForm({ name: '', taxId: '', type: 'CLIENT', email: '', phone: '' }); setShowForm(true); };
  const openEdit = (c: ThirdParty) => { setEditing(c); setForm({ name: c.name, taxId: c.taxId, type: c.type, email: c.email, phone: c.phone }); setShowForm(true); };
  const handleSave = () => {
    if (!form.name || !form.taxId) { toast.error('Nombre y RFC son obligatorios'); return; }
    if (editing) { setParties(prev => prev.map(p => p.id === editing.id ? { ...p, ...form } : p)); toast.success('Tercero actualizado'); }
    else { setParties(prev => [...prev, { id: Date.now().toString(), ...form, balance: 0, isActive: true }]); toast.success('Tercero creado'); }
    setShowForm(false);
  };
  const handleDelete = () => { if (deleteId) { setParties(prev => prev.filter(p => p.id !== deleteId)); toast.success('Tercero eliminado'); setDeleteId(null); } };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  const totalClients = parties.filter(p => p.type === 'CLIENT' || p.type === 'BOTH').length;
  const totalSuppliers = parties.filter(p => p.type === 'SUPPLIER' || p.type === 'BOTH').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h2 className="text-2xl font-playfair font-bold text-vintage-900">Terceros</h2><p className="text-sm text-vintage-600 mt-1">Clientes, proveedores y acreedores</p></div>
        <PastelButton onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nuevo Tercero</PastelButton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <VintageCard><p className="text-xs text-vintage-500">Total</p><p className="text-2xl font-bold text-vintage-800">{parties.length}</p></VintageCard>
        <VintageCard><p className="text-xs text-vintage-500">Clientes</p><p className="text-2xl font-bold text-success">{totalClients}</p></VintageCard>
        <VintageCard><p className="text-xs text-vintage-500">Proveedores</p><p className="text-2xl font-bold text-info">{totalSuppliers}</p></VintageCard>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vintage-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o RFC..." className="w-full pl-10 pr-4 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400">
          <option value="">Todos los tipos</option>
          <option value="CLIENT">Clientes</option>
          <option value="SUPPLIER">Proveedores</option>
          <option value="BOTH">Ambos</option>
        </select>
      </div>

      <VintageCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-vintage-200 bg-vintage-50/50">
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Nombre</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">RFC</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-right">Saldo</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vintage-100">
              {filtered.map((p, i) => (
                <motion.tr key={p.id} className="hover:bg-vintage-50 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td className="px-4 py-3"><div><p className="text-sm font-medium text-vintage-800">{p.name}</p><p className="text-xs text-vintage-500">{p.email}</p></div></td>
                  <td className="px-4 py-3"><span className="font-mono text-xs text-vintage-600">{p.taxId}</span></td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={typeColors[p.type] as any} label={typeLabels[p.type]} /></td>
                  <td className={cn('px-4 py-3 text-sm text-right font-mono', p.balance > 0 ? 'text-success' : p.balance < 0 ? 'text-error' : 'text-vintage-600')}>{formatCurrency(p.balance)}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={p.isActive ? 'success' : 'neutral'} label={p.isActive ? 'Activo' : 'Inactivo'} /></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-vintage-100 text-vintage-500"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-error/10 text-vintage-500 hover:text-error"><Trash2 className="w-3.5 h-3.5" /></button>
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
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <motion.div className="relative bg-card rounded-2xl p-6 max-w-lg w-full shadow-xl border border-vintage-200" initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
            <h3 className="text-lg font-playfair font-bold text-vintage-800 mb-4">{editing ? 'Editar' : 'Nuevo'} Tercero</h3>
            <div className="space-y-4">
              <FloatingInput label="Nombre / Razón Social" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <FloatingInput label="RFC" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
              <div className="relative">
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ThirdParty['type'] })} className="peer w-full px-3 pt-5 pb-2 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 appearance-none">
                  <option value="CLIENT">Cliente</option><option value="SUPPLIER">Proveedor</option><option value="BOTH">Ambos</option>
                </select>
                <label className="absolute left-3 top-1.5 text-xs text-vintage-500 font-medium pointer-events-none">Tipo</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FloatingInput label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <FloatingInput label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-xl border border-vintage-200 text-vintage-700 hover:bg-vintage-50">Cancelar</button>
              <PastelButton onClick={handleSave}>{editing ? 'Guardar' : 'Crear'}</PastelButton>
            </div>
          </motion.div>
        </motion.div>
      )}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Eliminar tercero" description="¿Eliminar este tercero del catálogo?" variant="destructive" />
    </div>
  );
}
