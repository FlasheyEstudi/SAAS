'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  Eye,
  Send,
  Trash2,
  BookOpen,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { exportJournalEntriesExcel, exportJournalEntriesPDF } from '@/lib/utils/export';
import { useJournalEntries } from '../hooks/useJournalEntries';
import { useAppStore } from '@/lib/stores/useAppStore';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { StatusBadge } from '@/components/ui/vintage-ui';
import { AnimatedTable, Pagination, FilterBar } from '@/components/tables/animated-table';
import { formatCurrency, formatDate, getStatusLabel, getEntryTypeColor } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// Entry type options
const typeFilterOptions = [
  { value: 'DIARIO', label: 'Diario' },
  { value: 'EGRESO', label: 'Egreso' },
  { value: 'INGRESO', label: 'Ingreso' },
  { value: 'TRASPASO', label: 'Traspaso' },
];

// Status filter options
const statusFilterOptions = [
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'POSTED', label: 'Publicada' },
];

export function JournalListView() {
  const navigate = useAppStore((s) => s.navigate);
  const {
    entries = [], isLoading, total = 0, totalPages = 1, page = 1, limit = 20,
    search = '', typeFilter = '', statusFilter = '',
    setSearch, setTypeFilter, setStatusFilter, setPage, clearFilters,
    deleteEntry, postEntry,
  } = useJournalEntries() as any;

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [postingId, setPostingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      toast.loading('Generando exportación...');
      const companyName = 'GANESHA Compañía Demo';
      if (format === 'excel') {
        await exportJournalEntriesExcel(entries, companyName);
      } else {
        await exportJournalEntriesPDF(entries, companyName);
      }
      toast.dismiss();
      toast.success(`Pólizas exportadas en ${format.toUpperCase()}`);
    } catch {
      toast.dismiss();
      toast.error('Error al exportar pólizas');
    }
  };

  const handleView = useCallback(
    (id: string) => {
      navigate('journal-detail', { id });
    },
    [navigate]
  );

  const handleCreate = useCallback(() => {
    navigate('journal-create');
  }, [navigate]);

  const handleRowClick = useCallback(
    (entry: any) => {
      navigate('journal-detail', { id: entry.id });
    },
    [navigate]
  );

  const handlePost = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPostingId(id);
    try {
      const result = await postEntry(id);
      if (result) {
        toast.success('Póliza publicada correctamente');
      } else {
        toast.error('No se pudo publicar la póliza');
      }
    } catch {
      toast.error('Error al publicar la póliza');
    } finally {
      setPostingId(null);
    }
  }, [postEntry]);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      const ok = await deleteEntry(id);
      if (ok) {
        toast.success('Póliza eliminada correctamente');
      } else {
        toast.error('No se pudo eliminar la póliza');
      }
    } catch {
      toast.error('Error al eliminar la póliza');
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }, [deleteEntry]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, 'success' | 'warning'> = {
      POSTED: 'success',
      DRAFT: 'warning',
    };
    return (
      <StatusBadge status={map[status] || 'neutral'} label={getStatusLabel(status)} />
    );
  };

  const getTypeBadge = (type: string) => (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full', getEntryTypeColor(type))}>
      {getStatusLabel(type)}
    </span>
  );

  const tableHeaders = [
    { key: 'number', label: '# Póliza', align: 'left' as const, className: 'w-[140px]' },
    { key: 'date', label: 'Fecha', align: 'left' as const, className: 'w-[110px]' },
    { key: 'type', label: 'Tipo', align: 'center' as const, className: 'w-[100px]' },
    { key: 'description', label: 'Descripción', align: 'left' as const },
    { key: 'debit', label: 'Debe', align: 'right' as const, className: 'w-[130px]' },
    { key: 'credit', label: 'Haber', align: 'right' as const, className: 'w-[130px]' },
    { key: 'status', label: 'Estado', align: 'center' as const, className: 'w-[110px]' },
    { key: 'actions', label: 'Acciones', align: 'center' as const, className: 'w-[120px]' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Page header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lavender/30 dark:bg-indigo-950/30 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-vintage-700 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-playfair text-vintage-800 dark:text-zinc-100">Pólizas</h1>
            <p className="text-sm text-vintage-500 dark:text-zinc-500">Registro de pólizas contables</p>
          </div>
        </div>
        <div className="flex gap-2">
          <PastelButton variant="outline" onClick={() => handleExport('pdf')} className="gap-2">
            <Download className="w-4 h-4" />
            PDF
          </PastelButton>
          <PastelButton variant="outline" onClick={() => handleExport('excel')} className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </PastelButton>
          <PastelButton onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva Póliza
          </PastelButton>
        </div>
      </motion.div>

      {/* Filter bar */}
      <motion.div variants={itemVariants}>
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por descripción o número de póliza..."
          filters={[
            { key: 'type', label: 'Tipo de póliza', options: typeFilterOptions },
            { key: 'status', label: 'Estado', options: statusFilterOptions },
          ]}
          activeFilters={{ type: typeFilter, status: statusFilter }}
          onFilterChange={(key, value) => {
            if (key === 'type') setTypeFilter(value);
            if (key === 'status') setStatusFilter(value);
          }}
          onClearFilters={clearFilters}
        />
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <VintageCard hover={false} className="p-4">
          <p className="text-xs text-vintage-500 dark:text-zinc-500 font-medium uppercase tracking-wider">Total pólizas</p>
          <p className="text-xl font-playfair text-vintage-800 dark:text-zinc-100 mt-1">{total}</p>
        </VintageCard>
        <VintageCard hover={false} className="p-4">
          <p className="text-xs text-vintage-500 dark:text-zinc-500 font-medium uppercase tracking-wider">Publicadas</p>
          <p className="text-xl font-playfair text-success dark:text-emerald-400 mt-1">
            {(entries || []).filter((e: any) => e.status === 'POSTED').length}
          </p>
        </VintageCard>
        <VintageCard hover={false} className="p-4">
          <p className="text-xs text-vintage-500 dark:text-zinc-500 font-medium uppercase tracking-wider">Borradores</p>
          <p className="text-xl font-playfair text-warning dark:text-amber-400 mt-1">
            {(entries || []).filter((e: any) => e.status === 'DRAFT').length}
          </p>
        </VintageCard>
        <VintageCard hover={false} className="p-4">
          <p className="text-xs text-vintage-500 dark:text-zinc-500 font-medium uppercase tracking-wider">Total Debe</p>
          <p className="text-xl font-playfair text-vintage-800 dark:text-zinc-100 mt-1">
            {formatCurrency((entries || []).reduce((s: number, e: any) => s + (e.totalDebit || 0), 0), 'NIO')}
          </p>
        </VintageCard>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <AnimatedTable
          headers={tableHeaders}
          data={entries}
          keyExtractor={(row) => row.id}
          onRowClick={handleRowClick}
          isLoading={isLoading}
          emptyMessage="No se encontraron pólizas"
          emptyIcon={<FileText />}
          renderRow={(row) => (
            <>
              <td className="px-4 py-3">
                <span className="text-sm font-semibold text-vintage-800 dark:text-zinc-200">{row.entryNumber}</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-vintage-600 dark:text-zinc-500">{formatDate(row.entryDate)}</span>
              </td>
              <td className="px-4 py-3 text-center">{getTypeBadge(row.entryType)}</td>
              <td className="px-4 py-3">
                <span className="text-sm text-vintage-700 dark:text-zinc-400 line-clamp-1">{row.description}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-mono text-vintage-700 dark:text-zinc-400">{formatCurrency(row.totalDebit, 'NIO')}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-mono text-vintage-700 dark:text-zinc-400">{formatCurrency(row.totalCredit, 'NIO')}</span>
              </td>
              <td className="px-4 py-3 text-center">{getStatusBadge(row.status)}</td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleView(row.id); }}
                    className="p-1.5 rounded-lg text-vintage-500 dark:text-zinc-500 hover:text-vintage-800 dark:hover:text-zinc-200 hover:bg-vintage-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Ver detalle"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {row.status === 'DRAFT' && (
                    <button
                      onClick={(e) => handlePost(row.id, e)}
                      disabled={postingId === row.id}
                      className="p-1.5 rounded-lg text-success/70 hover:text-success hover:bg-success/10 transition-colors disabled:opacity-50"
                      title="Publicar póliza"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                  {row.status === 'DRAFT' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(row.id); }}
                      disabled={deletingId === row.id}
                      className="p-1.5 rounded-lg text-error/70 hover:text-error hover:bg-error/10 transition-colors disabled:opacity-50"
                      title="Eliminar póliza"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </>
          )}
        />
      </motion.div>

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <motion.div variants={itemVariants}>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            total={total}
            limit={limit}
          />
        </motion.div>
      )}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <motion.div
            className="relative bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl border border-vintage-200 dark:border-zinc-800"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-playfair text-vintage-800 dark:text-zinc-100 mb-2">Eliminar Póliza</h3>
            <p className="text-sm text-vintage-600 dark:text-zinc-500 mb-6">
              ¿Estás seguro de que deseas eliminar esta póliza? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm rounded-xl border border-vintage-200 dark:border-zinc-800 text-vintage-700 dark:text-zinc-400 hover:bg-vintage-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deletingId === confirmDelete}
                className="px-4 py-2 text-sm rounded-xl bg-error hover:bg-error/80 text-white transition-colors disabled:opacity-50"
              >
                {deletingId === confirmDelete ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
