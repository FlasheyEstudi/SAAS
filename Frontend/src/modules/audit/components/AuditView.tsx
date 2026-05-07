'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  ChevronRight, 
  Clock, 
  User as UserIcon, 
  Database,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FileText,
  Trash2,
  Edit2,
  Plus
} from 'lucide-react';
import { useAudit } from '../hooks/useAudit';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { AnimatedTable, Pagination } from '@/components/tables/animated-table';
import { formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { exportAuditExcel } from '@/lib/utils/export';
import { useAppStore } from '@/lib/stores/useAppStore';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { GaneshaLoader } from '@/components/ui/ganesha-loader';


const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

function getActionIcon(action: string) {
  switch (action) {
    case 'CREATE': return <Plus className="w-3.5 h-3.5" />;
    case 'UPDATE': return <Edit2 className="w-3.5 h-3.5" />;
    case 'DELETE': return <Trash2 className="w-3.5 h-3.5" />;
    case 'LOGIN': return <UserIcon className="w-3.5 h-3.5" />;
    default: return <FileText className="w-3.5 h-3.5" />;
  }
}

function getActionColor(action: string) {
  switch (action) {
    case 'CREATE': return 'bg-success/15 text-success';
    case 'UPDATE': return 'bg-info/15 text-info';
    case 'DELETE': return 'bg-error/15 text-error';
    case 'LOGIN': return 'bg-lavender/30 text-vintage-700 dark:text-zinc-200';
    default: return 'bg-vintage-100 text-vintage-600';
  }
}

export function AuditView() {
  const currentCompany = useAppStore(s => s.currentCompany);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { logs, pagination, isLoading } = useAudit({
    page,
    limit: 15,
    search: search || undefined,
    entityType: entityType || undefined,
  });

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (loading) return <GaneshaLoader variant="compact" message="Sincronizando Bitácora..." />;

  const handleExport = async () => {
    if (!logs.length) return;
    try {
      toast.loading('Generando reporte...', { id: 'export-loading', duration: 8000 });
      await exportAuditExcel(logs, currentCompany?.name || 'GANESHA');
      toast.success('Bitácora exportada a Excel');
    } catch {
      toast.error('Error al exportar bitácora', { id: 'export-loading' });
    }
  };

  const tableHeaders = [
    { key: 'timestamp', label: 'Fecha', align: 'left' as const, className: 'w-[180px]' },
    { key: 'user', label: 'Usuario', align: 'left' as const, className: 'w-[200px]' },
    { key: 'action', label: 'Acción', align: 'center' as const, className: 'w-[120px]' },
    { key: 'entity', label: 'Entidad', align: 'left' as const },
    { key: 'details', label: 'Detalles', align: 'left' as const, className: 'hidden md:table-cell' },
  ];

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lavender/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-vintage-700 dark:text-zinc-200" />
          </div>
          <div>
            <h1 className="text-2xl font-playfair text-vintage-800 dark:text-zinc-100">Auditoría de Sistema</h1>
            <p className="text-sm text-vintage-500 dark:text-zinc-400">Trazabilidad completa de acciones y cambios</p>
          </div>
        </div>
        <div className="flex gap-2">
          <PastelButton variant="outline" onClick={handleExport} className="gap-2">
            <FileText className="w-4 h-4" />
            Exportar Excel
          </PastelButton>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vintage-400" />
          <input
            type="text"
            placeholder="Buscar por descripción o etiqueta de entidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-vintage-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 text-sm transition-all"
          />
        </div>
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="px-4 py-2 bg-card border border-vintage-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 text-sm"
        >
          <option value="">Todas las entidades</option>
          <option value="Invoice">Facturas</option>
          <option value="JournalEntry">Asientos Contables</option>
          <option value="ThirdParty">Terceros</option>
          <option value="BankAccount">Cuentas Bancarias</option>
          <option value="TaxRate">Impuestos</option>
        </select>
        <PastelButton variant="outline" className="gap-2" onClick={() => { setSearch(''); setEntityType(''); }}>
          Limpiar
        </PastelButton>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <VintageCard variant="premium" className="p-4 flex items-center gap-4 border-none">
          <div className="w-10 h-10 rounded-lg bg-vintage-100 dark:bg-zinc-800 flex items-center justify-center">
            <Clock className="w-5 h-5 text-vintage-500 dark:text-zinc-400" />
          </div>
          <div>
            <p className="text-xs text-vintage-500 dark:text-zinc-400 font-medium uppercase tracking-wider">Total Eventos</p>
            <p className="text-xl font-playfair text-vintage-800 dark:text-zinc-100 font-bold">{pagination.total}</p>
          </div>
        </VintageCard>
        <VintageCard variant="premium" className="p-4 flex items-center gap-4 border-none">
          <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
            <Database className="w-5 h-5 text-info" />
          </div>
          <div>
            <p className="text-xs text-vintage-500 dark:text-zinc-400 font-medium uppercase tracking-wider">Entidades</p>
            <p className="text-xl font-playfair text-vintage-800 dark:text-zinc-100 font-bold">{isLoading ? '...' : '6'}</p>
          </div>
        </VintageCard>
        <VintageCard variant="premium" className="p-4 flex items-center gap-4 border-none">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xs text-vintage-500 dark:text-zinc-400 font-medium uppercase tracking-wider">Estado</p>
            <p className="text-xl font-playfair text-vintage-800 dark:text-zinc-100 font-bold">Protegido</p>
          </div>
        </VintageCard>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <AnimatedTable
          headers={tableHeaders}
          data={logs}
          isLoading={isLoading}
          onRowClick={(row) => setSelectedLog(row)}
          keyExtractor={(row) => row.id}
          renderRow={(row) => (
            <>
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-sm text-vintage-800 dark:text-zinc-100 font-medium">{formatDate(row.createdAt, 'dd/MM/yyyy')}</span>
                  <span className="text-xs text-vintage-500 dark:text-zinc-400 font-mono">{formatDate(row.createdAt, 'HH:mm:ss')}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-vintage-200 flex items-center justify-center text-[10px] font-bold text-vintage-600">
                    {row.user?.name?.[0] || 'U'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-vintage-700 dark:text-zinc-200 font-medium">{row.user?.name || 'Sistema'}</span>
                    <span className="text-xs text-vintage-400">{row.user?.email || 'auto@ganesha.ai'}</span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                  getActionColor(row.action)
                )}>
                  {getActionIcon(row.action)}
                  {row.action}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-vintage-800 dark:text-zinc-100">{row.entityLabel || row.entityType}</span>
                  <div className="flex items-center gap-1 text-[10px] text-vintage-400 uppercase tracking-tighter">
                    <Database className="w-2.5 h-2.5" />
                    {row.entityType}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <p className="text-xs text-vintage-600 line-clamp-2 max-w-[300px]">
                  {row.action === 'UPDATE' ? 'Ver cambios detallados (Forensic View)' : 
                   row.action === 'CREATE' ? 'Creación de registro maestro' : 
                   row.action === 'DELETE' ? 'Eliminación irreversible' :
                   'Acceso/Login'}
                </p>
              </td>
            </>
          )}
        />
      </motion.div>

      {/* Forensic Detail Modal (Elite Proposal) */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-vintage-100 flex items-center justify-between bg-vintage-50/50">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", getActionColor(selectedLog.action))}>
                    {getActionIcon(selectedLog.action)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-vintage-800">Detalle Forense: {selectedLog.entityLabel || selectedLog.entityType}</h3>
                    <p className="text-[10px] text-vintage-500 uppercase tracking-widest">{selectedLog.action} · {formatDate(selectedLog.createdAt, 'dd/MM/yyyy HH:mm:ss')}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="text-vintage-400 hover:text-vintage-600">
                  <Trash2 className="w-5 h-5 rotate-45" /> {/* Close icon using trash rotate */}
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {selectedLog.action === 'UPDATE' && selectedLog.oldValues ? (
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-vintage-400 uppercase tracking-widest mb-2">Comparativa de Cambios (Diff)</p>
                    {Object.keys(selectedLog.newValues).map(key => {
                      const oldVal = selectedLog.oldValues[key];
                      const newVal = selectedLog.newValues[key];
                      if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return null;

                      return (
                        <div key={key} className="grid grid-cols-2 gap-4 pb-3 border-b border-vintage-50 last:border-0">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-vintage-400 uppercase">{key}</span>
                            <div className="p-2 rounded bg-error/5 text-error text-xs line-clamp-2 strike-through">
                              {JSON.stringify(oldVal)}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-vintage-400 uppercase opacity-0">{key}</span>
                            <div className="p-2 rounded bg-success/5 text-success text-xs line-clamp-2">
                              {JSON.stringify(newVal)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-vintage-50/50 p-6 rounded-xl border border-dashed border-vintage-200 text-center">
                    <Database className="w-8 h-8 text-vintage-300 mx-auto mb-3" />
                    <p className="text-sm text-vintage-600">
                      {selectedLog.action === 'CREATE' ? 'Registro inicial completo. No hay historial previo.' : 'Acción de sistema sin cambios en datos estructurados.'}
                    </p>
                    <pre className="mt-4 text-[10px] text-left p-3 bg-zinc-900 text-zinc-300 rounded overflow-x-auto">
                      {JSON.stringify(selectedLog.newValues || selectedLog.metadata || {}, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              <div className="p-4 bg-vintage-50/50 border-t border-vintage-100 flex justify-end">
                <PastelButton onClick={() => setSelectedLog(null)} size="sm">Cerrar Detalle</PastelButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <motion.div variants={itemVariants} className="flex justify-center mt-4">
          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            total={pagination.total}
            limit={pagination.limit || 15}
          />
        </motion.div>
      )}

      {/* No results */}
      {!isLoading && logs.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-vintage-400"
        >
          <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
          <p>No se encontraron registros que coincidan con los filtros</p>
        </motion.div>
      )}
    </motion.div>
  );
}
