'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCog, Shield, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { StatusBadge, ConfirmDialog } from '@/components/ui/vintage-ui';
import { formatDate, getInitials } from '@/lib/utils/format';

interface User { id: string; name: string; email: string; role: 'ADMIN' | 'ACCOUNTANT' | 'MANAGER' | 'VIEWER'; isActive: boolean; lastLogin: string; }

const mockUsers: User[] = [
  { id: '1', name: 'María García López', email: 'maria.garcia@contable.mx', role: 'ADMIN', isActive: true, lastLogin: '2025-08-15T09:30:00' },
  { id: '2', name: 'Carlos Rodríguez', email: 'carlos.rodriguez@contable.mx', role: 'ACCOUNTANT', isActive: true, lastLogin: '2025-08-15T08:45:00' },
  { id: '3', name: 'Ana Martínez Ruiz', email: 'ana.martinez@contable.mx', role: 'ACCOUNTANT', isActive: true, lastLogin: '2025-08-14T17:20:00' },
  { id: '4', name: 'Roberto Sánchez', email: 'roberto.sanchez@contable.mx', role: 'MANAGER', isActive: true, lastLogin: '2025-08-14T14:10:00' },
  { id: '5', name: 'Laura Hernández', email: 'laura.hernandez@contable.mx', role: 'VIEWER', isActive: true, lastLogin: '2025-08-13T11:00:00' },
  { id: '6', name: 'Pedro Gómez (inactivo)', email: 'pedro.gomez@contable.mx', role: 'ACCOUNTANT', isActive: false, lastLogin: '2025-06-20T16:30:00' },
];

const roleLabels: Record<string, string> = { ADMIN: 'Administrador', ACCOUNTANT: 'Contador', MANAGER: 'Gerente', VIEWER: 'Visor' };
const roleColors: Record<string, string> = { ADMIN: 'error', ACCOUNTANT: 'success', MANAGER: 'warning', VIEWER: 'neutral' };

export function UsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { setTimeout(() => { setUsers(mockUsers); setLoading(false); }, 500); }, []);

  const handleDelete = () => { if (deleteId) { setUsers(prev => prev.filter(u => u.id !== deleteId)); toast.success('Usuario eliminado'); setDeleteId(null); } };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-playfair font-bold text-vintage-900">Usuarios</h2><p className="text-sm text-vintage-600 mt-1">Gestión de usuarios y permisos</p></div>
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
            {users.map((u, i) => (
              <motion.tr key={u.id} className="hover:bg-vintage-50 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vintage-300 to-vintage-400 flex items-center justify-center text-white text-xs font-bold">{getInitials(u.name)}</div>
                    <span className="text-sm font-medium text-vintage-800">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-vintage-600">{u.email}</td>
                <td className="px-4 py-3 text-center"><StatusBadge status={roleColors[u.role] as any} label={roleLabels[u.role]} /></td>
                <td className="px-4 py-3 text-xs text-vintage-500">{formatDate(u.lastLogin, 'dd/MM/yyyy HH:mm')}</td>
                <td className="px-4 py-3 text-center"><StatusBadge status={u.isActive ? 'success' : 'neutral'} label={u.isActive ? 'Activo' : 'Inactivo'} /></td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => toast.info('Función próximamente')} className="p-1.5 rounded-lg hover:bg-vintage-100 text-vintage-500"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-lg hover:bg-error/10 text-vintage-500 hover:text-error"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </VintageCard>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Eliminar usuario" description="¿Eliminar este usuario del sistema?" variant="destructive" />
    </div>
  );
}
