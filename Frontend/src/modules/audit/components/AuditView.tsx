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
    case 'LOGIN': return 'bg-lavender/30 text-vintage-700';
    default: return 'bg-vintage-100 text-vintage-600';
  }
}

export function AuditView() {
  const currentCompany = useAppStore(s => s.currentCompany);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('');
  
  const { logs, pagination, isLoading } = useAudit({
    page,
    limit: 15,
    search: search || undefined,
    entityType: entityType || undefined,
  });

  const handleExport = async () => {
    if (!logs.length) return;
    toast.loading('Generando reporte...', { id: 'export-loading', duration: 8000 });
    await exportAuditExcel(logs, currentCompany?.name || 'GANESHA');
    toast.dismiss(toastId);
    toast.success('Bitácora exportada a Excel');
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
            <ShieldCheck className="w-5 h-5 text-vintage-700" />
          </div>
          <div>
            <h1 className="text-2xl font-playfair text-vintage-800">Auditoría de Sistema</h1>
            <p className="text-sm text-vintage-500">Trazabilidad completa de acciones y cambios</p>
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
            className="w-full pl-10 pr-4 py-2 bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 text-sm transition-all"
          />
        </div>
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="px-4 py-2 bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 text-sm"
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
            <Clock className="w-5 h-5 text-vintage-500" />
          </div>
          <div>
            <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Total Eventos</p>
            <p className="text-xl font-playfair text-vintage-800 dark:text-zinc-100 font-bold">{pagination.total}</p>
          </div>
        </VintageCard>
        <VintageCard variant="premium" className="p-4 flex items-center gap-4 border-none">
          <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
            <Database className="w-5 h-5 text-info" />
          </div>
          <div>
            <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Entidades</p>
            <p className="text-xl font-playfair text-vintage-800 dark:text-zinc-100 font-bold">{isLoading ? '...' : '6'}</p>
          </div>
        </VintageCard>
        <VintageCard variant="premium" className="p-4 flex items-center gap-4 border-none">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Días Historial</p>
            <p className="text-xl font-playfair text-vintage-800 dark:text-zinc-100 font-bold">{isLoading ? '...' : logs.length > 0 ? Math.ceil((new Date().getTime() - new Date(logs[logs.length-1].createdAt).getTime()) / (1000 * 3600 * 24)) : 0}</p>
          </div>
        </VintageCard>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <AnimatedTable
          headers={tableHeaders}
          data={logs}
          isLoading={isLoading}
          keyExtractor={(row) => row.id}
          renderRow={(row) => (
            <>
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-sm text-vintage-800 font-medium">{formatDate(row.createdAt, 'dd/MM/yyyy')}</span>
                  <span className="text-xs text-vintage-500 font-mono">{formatDate(row.createdAt, 'HH:mm:ss')}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-vintage-200 flex items-center justify-center text-[10px] font-bold text-vintage-600">
                    {row.user?.name?.[0] || 'U'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-vintage-700 font-medium">{row.user?.name || 'Sistema'}</span>
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
                  <span className="text-sm font-semibold text-vintage-800">{row.entityLabel || row.entityType}</span>
                  <div className="flex items-center gap-1 text-[10px] text-vintage-400 uppercase tracking-tighter">
                    <Database className="w-2.5 h-2.5" />
                    {row.entityType}
                    <ChevronRight className="w-2.5 h-2.5" />
                    {row.entityId.substring(0, 8)}...
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <p className="text-xs text-vintage-600 line-clamp-2 max-w-[300px]">
                  {row.action === 'UPDATE' ? 'Modificó valores de la entidad' : 
                   row.action === 'CREATE' ? 'Creó nueva entrada' : 
                   row.action === 'DELETE' ? 'Eliminó registro permanently' :
                   'Acceso al sistema'}
                </p>
              </td>
            </>
          )}
        />
      </motion.div>

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
