'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Download, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { formatDate, formatRelativeTime } from '@/lib/utils/format';
import { useAudit } from '../hooks/useAudit';
import { cn } from '@/lib/utils';

const actionColors: Record<string, string> = { 
  CREATE: 'bg-success/20 text-success', 
  UPDATE: 'bg-info/20 text-info', 
  DELETE: 'bg-error/20 text-error', 
  POST: 'bg-success/20 text-success', 
  PAY: 'bg-warning/20 text-warning', 
  VIEW: 'bg-vintage-200/50 text-vintage-700', 
  CLOSE: 'bg-warning/20 text-warning', 
  RECONCILE: 'bg-info/20 text-info', 
  EXPORT: 'bg-info/20 text-info',
  LOGIN: 'bg-vintage-200/50 text-vintage-700',
  LOGOUT: 'bg-vintage-200/50 text-vintage-700',
};

export function AuditView() {
  const { logs = [], stats, loading, exporting, refreshLogs, exportLogs } = useAudit();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const filtered = (logs || []).filter(l => {
    if (!l) return false;
    const searchLower = (search || '').toLowerCase();
    const actionMatch = !actionFilter || l.action === actionFilter;
    const searchMatch = !search || 
      (l.user?.toLowerCase().includes(searchLower)) || 
      (l.details?.toLowerCase().includes(searchLower)) || 
      (l.entityId?.toLowerCase().includes(searchLower));
    return actionMatch && searchMatch;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h2 className="text-2xl font-playfair font-bold text-vintage-900">Bitácora de Auditoría</h2><p className="text-sm text-vintage-600 mt-1">Registro de actividades del sistema</p></div>
        <div className="flex gap-2">
          <PastelButton variant="outline" onClick={() => exportLogs('csv')} disabled={exporting}><FileDown className="w-4 h-4 mr-2" />CSV</PastelButton>
          <PastelButton variant="outline" onClick={() => exportLogs('pdf')} disabled={exporting}><Download className="w-4 h-4 mr-2" />PDF</PastelButton>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <VintageCard><p className="text-xs text-vintage-500">Total Registros</p><p className="text-xl font-bold text-vintage-800">{stats.totalLogs}</p></VintageCard>
          <VintageCard><p className="text-xs text-vintage-500">Acciones Únicas</p><p className="text-xl font-bold text-vintage-800">{Object.keys(stats.logsByAction || {}).length}</p></VintageCard>
          <VintageCard><p className="text-xs text-vintage-500">Entidades</p><p className="text-xl font-bold text-vintage-800">{Object.keys(stats.logsByEntity || {}).length}</p></VintageCard>
          <VintageCard><p className="text-xs text-vintage-500">Actividad Reciente</p><p className="text-xl font-bold text-success">{stats.recentActivity}</p></VintageCard>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vintage-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por usuario, acción o detalle..." className="w-full pl-10 pr-4 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400" />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400">
          <option value="">Todas las acciones</option>
          {(logs || []).length > 0 && Array.from(new Set((logs || []).map(l => l.action))).map(a => <option key={a} value={a}>{a}</option>)}
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
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-vintage-500">No se encontraron registros</td></tr>
            ) : (
              filtered.map((l, i) => (
                <motion.tr key={l.id} className="hover:bg-vintage-50 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td className="px-4 py-3 text-xs text-vintage-500 whitespace-nowrap">{formatDate(l.timestamp, 'dd/MM/yy HH:mm')}</td>
                  <td className="px-4 py-3 text-sm font-medium text-vintage-800">{l.user}</td>
                  <td className="px-4 py-3 text-center"><span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', actionColors[l.action] || 'bg-vintage-200/50 text-vintage-700')}>{l.action}</span></td>
                  <td className="px-4 py-3"><span className="font-mono text-xs text-vintage-600 bg-vintage-100 px-1.5 py-0.5 rounded">{l.entityId}</span></td>
                  <td className="px-4 py-3 text-sm text-vintage-600 max-w-xs truncate">{l.details}</td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </VintageCard>
    </div>
  );
}
