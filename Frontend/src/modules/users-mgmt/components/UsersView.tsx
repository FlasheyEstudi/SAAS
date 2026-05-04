'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCog, Shield, Edit2, Trash2, Users, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { StatusBadge, ConfirmDialog } from '@/components/ui/vintage-ui';
import { PastelButton } from '@/components/ui/pastel-button';
import { formatDate, getInitials } from '@/lib/utils/format';

import { useUsers } from '../hooks/useUsers';
import { exportUsersExcel } from '@/lib/utils/export';
import { useAppStore } from '@/lib/stores/useAppStore';

const roleLabels: Record<string, string> = { ADMIN: 'Administrador', ACCOUNTANT: 'Contador', MANAGER: 'Gerente', VIEWER: 'Visor' };
const roleColors: Record<string, string> = { ADMIN: 'error', ACCOUNTANT: 'success', MANAGER: 'warning', VIEWER: 'neutral' };

export function UsersView() {
  const currentCompany = useAppStore(s => s.currentCompany);
  const { users, isLoading: loading, createUser, updateUser, deleteUser, isCreating, isUpdating, isDeleting } = useUsers() as any;
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<{ name: string; email: string; role: 'ADMIN' | 'ACCOUNTANT' | 'MANAGER' | 'VIEWER' }>({ 
    name: '', 
    email: '', 
    role: 'VIEWER' 
  });
  
  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', role: 'VIEWER' }); setShowForm(true); };
  const openEdit = (u: any) => { setEditing(u); setForm({ name: u.name, email: u.email, role: u.role }); setShowForm(true); };
  
  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Nombre y email requeridos'); return; }
    
    try {
      if (editing) {
        await updateUser({ id: editing.id, data: form });
      } else {
        await createUser(form);
      }
      setShowForm(false);
    } catch (err) {
      // Error handled by hook
    }
  };
  
  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteUser(deleteId);
        setDeleteId(null);
      } catch (err) {
        // Error handled by hook
      }
    }
  };

  const handleExport = async () => {
    if (!users.length) return;
    toast.loading('Generando reporte...', { id: 'export-loading', duration: 8000 });
    await exportUsersExcel(users, currentCompany?.name || 'GANESHA');
    toast.dismiss(toastId);
    toast.success('Lista de usuarios exportada');
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-playfair font-bold text-vintage-900">Usuarios</h2><p className="text-sm text-vintage-600 mt-1">Gestión de acceso y roles de usuario</p></div>
        <div className="flex gap-2">
          <PastelButton variant="outline" onClick={handleExport} className="gap-2">
            <Users className="w-4 h-4" />
            Exportar Excel
          </PastelButton>
          <PastelButton onClick={() => { setEditing(null); setShowForm(true); }}><Plus className="w-4 h-4 mr-2" />Nuevo Usuario</PastelButton>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {(['ADMIN', 'ACCOUNTANT', 'MANAGER', 'VIEWER'] as const).map(role => (
          <VintageCard key={role}>
            <StatusBadge status={roleColors[role] as any} label={roleLabels[role]} />
            <p className="text-2xl font-bold text-vintage-800 mt-2">{users.filter(u => u.role === role).length}</p>
          </VintageCard>
        ))}
      </div>

      <VintageCard className="p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-vintage-200 bg-vintage-50/50">
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Usuario</th>
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Email</th>
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center">Rol</th>
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Último Acceso</th>
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center">Estado</th>
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vintage-100">
            {users.map((u, i) => {
              if (!u) return null;
              return (
                <motion.tr key={u.id} className="hover:bg-vintage-50 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vintage-300 to-vintage-400 flex items-center justify-center text-white text-xs font-bold">{getInitials(u.name || 'U')}</div>
                      <span className="text-sm font-medium text-vintage-800">{u.name || 'Sin nombre'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-vintage-600">{u.email || '-'}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={(u.role ? roleColors[u.role] : 'neutral') as any} label={u.role ? roleLabels[u.role] : 'N/A'} /></td>
                  <td className="px-4 py-3 text-xs text-vintage-500">{u.lastLoginAt ? formatDate(u.lastLoginAt, 'dd/MM/yyyy HH:mm') : 'Nunca'}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={u.isActive ? 'success' : 'neutral'} label={u.isActive ? 'Activo' : 'Inactivo'} /></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-vintage-100 text-vintage-500"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-lg hover:bg-error/10 text-vintage-500 hover:text-error"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </VintageCard>

      {showForm && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <motion.div className="relative bg-card rounded-2xl p-6 max-w-md w-full shadow-xl border border-vintage-200" initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
            <h3 className="text-lg font-playfair font-bold text-vintage-800 mb-4">{editing ? 'Editar' : 'Nuevo'} Usuario</h3>
            <div className="space-y-4">
              <div className="space-y-1"><label className="text-xs text-vintage-600 font-medium ml-1">Nombre</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400" /></div>
              <div className="space-y-1"><label className="text-xs text-vintage-600 font-medium ml-1">Email</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400" /></div>
              <div className="space-y-1"><label className="text-xs text-vintage-600 font-medium ml-1">Rol</label>
                <select 
                  value={form.role} 
                  onChange={(e) => setForm({ ...form, role: e.target.value as any })} 
                  className="w-full px-3 py-2 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400"
                >
                  <option value="ADMIN">Administrador</option>
                  <option value="ACCOUNTANT">Contador</option>
                  <option value="MANAGER">Gerente</option>
                  <option value="VIEWER">Visor</option>
                </select></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-xl border border-vintage-200 text-vintage-700 hover:bg-vintage-50" disabled={isCreating || isUpdating}>Cancelar</button>
              <PastelButton onClick={handleSave} loading={isCreating || isUpdating}>{editing ? 'Guardar' : 'Crear'}</PastelButton>
            </div>
          </motion.div>
        </motion.div>
      )}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Eliminar usuario" description="¿Eliminar este usuario del sistema?" variant="destructive" />
    </div>
  );
}
