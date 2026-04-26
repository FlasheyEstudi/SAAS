'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Search, Download, FileDown, ChevronDown, ChevronUp, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { formatDate } from '@/lib/utils/format';
import { useAudit } from '../hooks/useAudit';
import { useAppStore } from '@/lib/stores/useAppStore';
import { exportAuditExcel, exportAuditPDF } from '@/lib/utils/export';
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

const entityLabels: Record<string, string> = {
  Invoice: 'Factura', JournalEntry: 'Póliza', BankAccount: 'Cuenta Bancaria',
  BankMovement: 'Movimiento', FixedAsset: 'Activo Fijo', ThirdParty: 'Tercero',
  Account: 'Cuenta', Period: 'Período', Budget: 'Presupuesto', User: 'Usuario',
  Company: 'Empresa', CostCenter: 'Centro de Costo',
};

export function AuditView() {
  const { logs = [], stats, loading, selectedLog, detailLoading, fetchLogDetail, setSelectedLog } = useAudit();
  const companyId = useAppStore((state) => state.companyId);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      toast.loading('Generando exportación...');
      const companyName = 'GANESHA';
      if (format === 'excel') {
        await exportAuditExcel(filtered, companyName);
      } else {
        await exportAuditPDF(filtered, companyName);
      }
      toast.dismiss();
      toast.success(`Bitácora exportada en ${format.toUpperCase()}`);
    } catch {
      toast.dismiss();
      toast.error('Error al exportar bitácora');
    }
  };

  const filtered = (logs || []).filter(l => {
    if (!l) return false;
    const searchLower = (search || '').toLowerCase();
    const actionMatch = !actionFilter || l.action === actionFilter;
    const searchMatch = !search || 
      (l.user?.name?.toLowerCase().includes(searchLower)) || 
      (l.user?.email?.toLowerCase().includes(searchLower)) ||
      (l.entityLabel?.toLowerCase().includes(searchLower)) || 
      (l.entityType?.toLowerCase().includes(searchLower)) ||
      (l.entityId?.toLowerCase().includes(searchLower));
    return actionMatch && searchMatch;
  });

  const handleRowClick = async (logId: string) => {
    if (expandedId === logId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(logId);
    await fetchLogDetail(logId);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h2 className="text-2xl font-playfair font-bold text-vintage-900">Bitácora de Auditoría</h2><p className="text-sm text-vintage-600 mt-1">Registro de actividades del sistema</p></div>
        <div className="flex gap-2">
          <PastelButton variant="outline" onClick={() => handleExport('excel')}><FileDown className="w-4 h-4 mr-2" />Excel</PastelButton>
          <PastelButton variant="outline" onClick={() => handleExport('pdf')}><Download className="w-4 h-4 mr-2" />PDF</PastelButton>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <VintageCard><p className="text-xs text-vintage-500">Total Acciones</p><p className="text-xl font-bold text-vintage-800">{stats?.totalActions ?? logs.length}</p></VintageCard>
        <VintageCard><p className="text-xs text-vintage-500">Tipos de Acción</p><p className="text-xl font-bold text-vintage-800">{Object.keys(stats?.byAction || {}).length || new Set(logs.map(l => l.action)).size}</p></VintageCard>
        <VintageCard><p className="text-xs text-vintage-500">Usuarios Activos</p><p className="text-xl font-bold text-vintage-800">{stats?.byUser?.length || new Set(logs.map(l => l.userId)).size}</p></VintageCard>
        <VintageCard><p className="text-xs text-vintage-500">Entidades</p><p className="text-xl font-bold text-success">{new Set(logs.map(l => l.entityType)).size}</p></VintageCard>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vintage-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por usuario, entidad o ID..." className="w-full pl-10 pr-4 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400" />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400">
          <option value="">Todas las acciones</option>
          {Array.from(new Set(logs.map(l => l.action))).map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Audit log table */}
      <VintageCard className="p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-vintage-200 bg-vintage-50/50">
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Fecha/Hora</th>
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Usuario</th>
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center">Acción</th>
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Tipo</th>
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Entidad</th>
              <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-center w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vintage-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-vintage-500">No se encontraron registros</td></tr>
            ) : (
              filtered.map((l, i) => (
                <motion.tr
                  key={l.id}
                  className={cn('hover:bg-vintage-50 transition-colors cursor-pointer', expandedId === l.id && 'bg-vintage-50')}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => handleRowClick(l.id)}
                >
                  <td className="px-4 py-3 text-xs text-vintage-500 whitespace-nowrap">{formatDate(l.createdAt, 'dd/MM/yy HH:mm')}</td>
                  <td className="px-4 py-3 text-sm font-medium text-vintage-800">{l.user?.name || 'Sistema'}</td>
                  <td className="px-4 py-3 text-center"><span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', actionColors[l.action] || 'bg-vintage-200/50 text-vintage-700')}>{l.action}</span></td>
                  <td className="px-4 py-3 text-xs text-vintage-600">{entityLabels[l.entityType] || l.entityType}</td>
                  <td className="px-4 py-3"><span className="font-mono text-xs text-vintage-600 bg-vintage-100 px-1.5 py-0.5 rounded">{l.entityLabel || l.entityId?.slice(0, 8)}</span></td>
                  <td className="px-4 py-3 text-center">
                    {expandedId === l.id ? <ChevronUp className="w-4 h-4 text-vintage-400 inline" /> : <Eye className="w-4 h-4 text-vintage-400 inline" />}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </VintageCard>

      {/* Detail modal */}
      <AnimatePresence>
        {expandedId && selectedLog && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 w-[480px] max-h-[60vh] bg-card border border-vintage-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-vintage-100 bg-vintage-50/50">
              <h3 className="text-sm font-playfair font-bold text-vintage-800">Detalle de Auditoría</h3>
              <button onClick={() => { setExpandedId(null); setSelectedLog(null); }} className="p-1 hover:bg-vintage-100 rounded-lg"><X className="w-4 h-4 text-vintage-500" /></button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(60vh-48px)] space-y-4">
              {detailLoading ? (
                <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-vintage-500">Acción</p><p className="font-semibold text-vintage-800">{selectedLog.action}</p></div>
                    <div><p className="text-xs text-vintage-500">Tipo Entidad</p><p className="font-semibold text-vintage-800">{entityLabels[selectedLog.entityType] || selectedLog.entityType}</p></div>
                    <div><p className="text-xs text-vintage-500">ID Entidad</p><p className="font-mono text-xs text-vintage-600">{selectedLog.entityId}</p></div>
                    <div><p className="text-xs text-vintage-500">Fecha</p><p className="text-vintage-700">{formatDate(selectedLog.createdAt, 'dd/MM/yyyy HH:mm:ss')}</p></div>
                    <div><p className="text-xs text-vintage-500">Usuario</p><p className="text-vintage-800">{selectedLog.user?.name}</p></div>
                    <div><p className="text-xs text-vintage-500">Email</p><p className="text-vintage-600 text-xs">{selectedLog.user?.email}</p></div>
                  </div>

                  {selectedLog.entityLabel && (
                    <div><p className="text-xs text-vintage-500 mb-1">Etiqueta</p><p className="text-sm text-vintage-700">{selectedLog.entityLabel}</p></div>
                  )}

                  {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                    <div>
                      <p className="text-xs text-vintage-500 mb-2 font-semibold">Cambios Realizados</p>
                      <div className="bg-vintage-50 rounded-xl p-3 space-y-1 max-h-48 overflow-y-auto">
                        {Object.entries(selectedLog.changes).map(([key, value]) => (
                          <div key={key} className="flex items-start gap-2 text-xs">
                            <span className="font-mono text-vintage-500 min-w-[120px]">{key}:</span>
                            <span className="text-success font-mono break-all">{JSON.stringify(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedLog.previousData && Object.keys(selectedLog.previousData).length > 0 && (
                    <div>
                      <p className="text-xs text-vintage-500 mb-2 font-semibold">Datos Anteriores</p>
                      <div className="bg-vintage-50 rounded-xl p-3 space-y-1 max-h-48 overflow-y-auto">
                        {Object.entries(selectedLog.previousData).map(([key, value]) => (
                          <div key={key} className="flex items-start gap-2 text-xs">
                            <span className="font-mono text-vintage-500 min-w-[120px]">{key}:</span>
                            <span className="text-error font-mono break-all">{JSON.stringify(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!selectedLog.changes || Object.keys(selectedLog.changes).length === 0) && 
                   (!selectedLog.previousData || Object.keys(selectedLog.previousData).length === 0) && (
                    <p className="text-xs text-vintage-400 text-center py-4">No se registraron cambios detallados para esta acción.</p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
