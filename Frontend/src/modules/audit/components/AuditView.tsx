'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Download } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { formatDate, formatRelativeTime } from '@/lib/utils/format';

interface LogEntry { id: string; user: string; action: string; entity: string; entityId: string; details: string; timestamp: string; }

const mockLogs: LogEntry[] = [
  { id: '1', user: 'María García', action: 'CREATE', entity: 'journal-entry', entityId: 'POL-2025-0045', details: 'Creada póliza de egreso por pago de nómina', timestamp: '2025-08-15T10:30:00' },
  { id: '2', user: 'Carlos Rodríguez', action: 'POST', entity: 'journal-entry', entityId: 'POL-2025-0044', details: 'Publicada póliza de diario por ajuste de inventario', timestamp: '2025-08-15T09:45:00' },
  { id: '3', user: 'María García', action: 'PAY', entity: 'invoice', entityId: 'FAC-2025-0078', details: 'Pago registrado para factura de Grupo Alfa', timestamp: '2025-08-15T09:15:00' },
  { id: '4', user: 'Ana Martínez', action: 'CREATE', entity: 'invoice', entityId: 'FAC-2025-0080', details: 'Nueva factura de venta a Hotel Paraíso', timestamp: '2025-08-14T17:20:00' },
  { id: '5', user: 'Carlos Rodríguez', action: 'CLOSE', entity: 'period', entityId: 'May-2025', details: 'Período mayo 2025 cerrado', timestamp: '2025-08-14T16:00:00' },
  { id: '6', user: 'Roberto Sánchez', action: 'VIEW', entity: 'report', entityId: 'balance-sheet', details: 'Balance general consultado Q2 2025', timestamp: '2025-08-14T14:10:00' },
  { id: '7', user: 'María García', action: 'UPDATE', entity: 'third-party', entityId: 'Grupo Alfa', details: 'Actualizados datos fiscales de Grupo Alfa S.A.', timestamp: '2025-08-14T11:30:00' },
  { id: '8', user: 'Ana Martínez', action: 'CREATE', entity: 'journal-entry', entityId: 'POL-2025-0043', details: 'Creada póliza de ingreso por servicio profesional', timestamp: '2025-08-14T10:00:00' },
  { id: '9', user: 'Carlos Rodríguez', action: 'RECONCILE', entity: 'bank-movement', entityId: 'BBVA-002', details: 'Conciliado movimiento bancario BBVA', timestamp: '2025-08-13T16:45:00' },
  { id: '10', user: 'María García', action: 'DELETE', entity: 'journal-entry', entityId: 'POL-2025-0040', details: 'Eliminada póliza borrador duplicada', timestamp: '2025-08-13T15:30:00' },
  { id: '11', user: 'Roberto Sánchez', action: 'EXPORT', entity: 'report', entityId: 'trial-balance', details: 'Exportada balanza de comprobación a PDF', timestamp: '2025-08-13T14:00:00' },
  { id: '12', user: 'Laura Hernández', action: 'VIEW', entity: 'dashboard', entityId: '-', details: 'Dashboard consultado', timestamp: '2025-08-13T11:00:00' },
];

const actionColors: Record<string, string> = { CREATE: 'success', UPDATE: 'info', DELETE: 'error', POST: 'success', PAY: 'warning', VIEW: 'neutral', CLOSE: 'warning', RECONCILE: 'info', EXPORT: 'info' };

export function AuditView() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => { setTimeout(() => { setLogs(mockLogs); setLoading(false); }, 500); }, []);

  const filtered = logs.filter(l => {
    const ms = !search || l.user.toLowerCase().includes(search.toLowerCase()) || l.details.toLowerCase().includes(search.toLowerCase()) || l.entityId.toLowerCase().includes(search.toLowerCase());
    const ma = !actionFilter || l.action === actionFilter;
    return ms && ma;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h2 className="text-2xl font-playfair font-bold text-vintage-900">Bitácora de Auditoría</h2><p className="text-sm text-vintage-600 mt-1">Registro de actividades del sistema</p></div>
        <PastelButton variant="outline" onClick={() => toast.info('Función próximamente')}><Download className="w-4 h-4 mr-2" />Exportar</PastelButton>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vintage-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por usuario, acción o detalle..." className="w-full pl-10 pr-4 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400" />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400">
          <option value="">Todas las acciones</option>
          {['CREATE', 'UPDATE', 'DELETE', 'POST', 'PAY', 'VIEW', 'CLOSE', 'RECONCILE', 'EXPORT'].map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <VintageCard className="p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-vintage-200 bg-vintage-50/50">
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Fecha/Hora</th>
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Usuario</th>
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center">Acción</th>
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Entidad</th>
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vintage-100">
            {filtered.map((l, i) => (
              <motion.tr key={l.id} className="hover:bg-vintage-50 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                <td className="px-4 py-3 text-xs text-vintage-500 whitespace-nowrap">{formatDate(l.timestamp, 'dd/MM/yy HH:mm')}</td>
                <td className="px-4 py-3 text-sm font-medium text-vintage-800">{l.user}</td>
                <td className="px-4 py-3 text-center"><span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', `bg-${actionColors[l.action] || 'vintage-200'}/20 text-${actionColors[l.action] || 'vintage-700'}`)}>{l.action}</span></td>
                <td className="px-4 py-3"><span className="font-mono text-xs text-vintage-600 bg-vintage-100 px-1.5 py-0.5 rounded">{l.entityId}</span></td>
                <td className="px-4 py-3 text-sm text-vintage-600 max-w-xs truncate">{l.details}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </VintageCard>
    </div>
  );
}
