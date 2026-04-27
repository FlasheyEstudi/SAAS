'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  Eye,
  CreditCard,
  XCircle,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { exportInvoicesExcel, exportInvoicesPDF } from '@/lib/utils/export';
import { useInvoices } from '../hooks/useInvoices';
import { useAppStore } from '@/lib/stores/useAppStore';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { StatusBadge } from '@/components/ui/vintage-ui';
import { AnimatedTable, Pagination, FilterBar } from '@/components/tables/animated-table';
import { ConfirmDialog } from '@/components/ui/vintage-ui';
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const typeFilterOptions = [
  { value: 'SALE', label: 'Venta' },
  { value: 'PURCHASE', label: 'Compra' },
];
const statusFilterOptions = [
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'PARTIAL', label: 'Parcial' },
  { value: 'PAID', label: 'Pagada' },
  { value: 'CANCELLED', label: 'Cancelada' },
  { value: 'OVERDUE', label: 'Vencida' },
];

function getInvoiceStatus(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    PAID: 'success', PARTIAL: 'info', PENDING: 'warning', OVERDUE: 'error',
    CANCELLED: 'neutral', DRAFT: 'neutral',
  };
  return map[status] || 'neutral';
}

function getTypeBadgeColor(type: string) {
  return type === 'SALE'
    ? 'bg-success/15 text-success'
    : 'bg-peach/30 text-vintage-800';
}

export function InvoiceListView() {
  const navigate = useAppStore((s) => s.navigate);
  const {
    invoices = [], thirdParties = [], isLoading,
    payInvoice, cancelInvoice,
    summary: rawSummary,
    total: rawTotal = 0, totalPages = 1, page = 1, limit = 20,
    search = '', typeFilter = '', statusFilter = '',
    setSearch, setTypeFilter, setStatusFilter, setPage, clearFilters,
  } = useInvoices() as any;

  // Compute summary from real data — the backend summary returns { totalAmount, totalBalanceDue }
  // but we also compute from invoices array as a reliable fallback
  const totalInvoiced = Number(rawSummary?.totalAmount || invoices.reduce((s: number, i: any) => s + (Number(i.totalAmount) || 0), 0));
  const pendingAmount = Number(rawSummary?.totalBalanceDue || invoices.filter((i: any) => i.status === 'PENDING' || i.status === 'PARTIAL').reduce((s: number, i: any) => s + (Number(i.balanceDue) || 0), 0));
  const overdueAmount = Number(invoices.filter((i: any) => i.status === 'OVERDUE').reduce((s: number, i: any) => s + (Number(i.balanceDue) || 0), 0));
  const paidAmount = Number(invoices.filter((i: any) => i.status === 'PAID').reduce((s: number, i: any) => s + (Number(i.totalAmount) || 0), 0));
  const total = rawTotal || invoices.length;


  const [cancelDialogId, setCancelDialogId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      toast.loading('Generando reporte de facturas...');
      const companyName = 'GANESHA Compañía Demo';
      
      const exportData = invoices.map((inv: any) => ({
        invoiceNumber: inv.number,
        date: inv.issueDate,
        thirdParty: { name: getThirdPartyName(inv.thirdPartyId) },
        subtotal: inv.subtotal || (Number(inv.totalAmount) / 1.15),
        taxAmount: inv.taxAmount || (Number(inv.totalAmount) - (Number(inv.totalAmount) / 1.15)),
        total: inv.totalAmount,
        status: inv.status
      }));

      if (format === 'excel') {
        await exportInvoicesExcel(exportData, companyName);
      } else {
        await exportInvoicesPDF(exportData, companyName);
      }
      toast.dismiss();
      toast.success(`Facturas exportadas en ${format.toUpperCase()}`);
    } catch {
      toast.dismiss();
      toast.error('Error al exportar facturas');
    }
  };

  const getThirdPartyName = useCallback((tpId: string) => {
    const tp = thirdParties.find((t) => t.id === tpId);
    return tp?.name ?? '—';
  }, [thirdParties]);

  const handleCreate = useCallback(() => {
    navigate('invoice-create');
  }, [navigate]);

  const handleRowClick = useCallback((row: any) => {
    navigate('invoice-detail', { id: row.id });
  }, [navigate]);

  const handlePay = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPayingId(id);
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) return;
    try {
      const ok = await payInvoice({ 
        id, 
        amount: invoice.balanceDue,
        description: `Pago registrado desde listado - ${new Date().toLocaleDateString()}`
      });
      if (ok) toast.success('Factura pagada correctamente');
      else toast.error('No se pudo registrar el pago');
    } catch {
      toast.error('Error al registrar el pago');
    } finally {
      setPayingId(null);
    }
  }, [payInvoice]);

  const handleCancel = useCallback(async () => {
    if (!cancelDialogId) return;
    try {
      const ok = await cancelInvoice(cancelDialogId);
      if (ok) toast.success('Factura cancelada correctamente');
      else toast.error('No se pudo cancelar la factura');
    } catch {
      toast.error('Error al cancelar la factura');
    } finally {
      setCancelDialogId(null);
    }
  }, [cancelDialogId, cancelInvoice]);

  const tableHeaders = [
    { key: 'number', label: '# Factura', align: 'left' as const, className: 'w-[160px]' },
    { key: 'date', label: 'Fecha', align: 'left' as const, className: 'w-[110px]' },
    { key: 'thirdParty', label: 'Tercero', align: 'left' as const },
    { key: 'type', label: 'Tipo', align: 'center' as const, className: 'w-[90px]' },
    { key: 'total', label: 'Total', align: 'right' as const, className: 'w-[130px]' },
    { key: 'balance', label: 'Saldo', align: 'right' as const, className: 'w-[130px]' },
    { key: 'status', label: 'Estado', align: 'center' as const, className: 'w-[110px]' },
    { key: 'actions', label: 'Acciones', align: 'center' as const, className: 'w-[120px]' },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Page header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-peach/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-vintage-700" />
          </div>
          <div>
            <h1 className="text-2xl font-playfair text-vintage-800">Facturas</h1>
            <p className="text-sm text-vintage-500">Gestión de facturas de venta y compra</p>
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
            Nueva Factura
          </PastelButton>
        </div>
      </motion.div>

      {/* Filter bar */}
      <motion.div variants={itemVariants}>
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por número, tercero o descripción..."
          filters={[
            { key: 'type', label: 'Tipo', options: typeFilterOptions },
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
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-vintage-500" />
            <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Total Facturado</p>
          </div>
          <p className="text-xl font-playfair text-vintage-800">{formatCurrency(totalInvoiced, 'NIO')}</p>
        </VintageCard>
        <VintageCard hover={false} className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-warning" />
            <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Pendiente Cobro</p>
          </div>
          <p className="text-xl font-playfair text-warning">{formatCurrency(pendingAmount, 'NIO')}</p>
        </VintageCard>
        <VintageCard hover={false} className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-error" />
            <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Vencidas</p>
          </div>
          <p className="text-xl font-playfair text-error">{formatCurrency(overdueAmount, 'NIO')}</p>
        </VintageCard>
        <VintageCard hover={false} className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Pagadas</p>
          </div>
          <p className="text-xl font-playfair text-success">{formatCurrency(paidAmount, 'NIO')}</p>
        </VintageCard>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <AnimatedTable
          headers={tableHeaders}
          data={invoices}
          keyExtractor={(row) => row.id}
          onRowClick={handleRowClick}
          isLoading={isLoading}
          emptyMessage="No se encontraron facturas"
          emptyIcon={<FileText />}
          renderRow={(row) => (
            <>
              <td className="px-4 py-3">
                <span className="text-sm font-semibold text-vintage-800">{row.number}</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-vintage-600">{formatDate(row.issueDate)}</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-vintage-700 line-clamp-1">{getThirdPartyName(row.thirdPartyId)}</span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className={cn('inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full', getTypeBadgeColor(row.invoiceType))}>
                  {getStatusLabel(row.invoiceType)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-mono text-vintage-700">{formatCurrency(row.totalAmount, 'NIO')}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className={cn('text-sm font-mono', row.balanceDue > 0 ? 'text-warning font-semibold' : 'text-vintage-500')}>
                  {formatCurrency(row.balanceDue, 'NIO')}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <StatusBadge status={getInvoiceStatus(row.status)} label={getStatusLabel(row.status)} />
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate('invoice-detail', { id: row.id }); }}
                    className="p-1.5 rounded-lg text-vintage-500 hover:text-vintage-800 hover:bg-vintage-100 transition-colors"
                    title="Ver detalle"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {(row.status === 'PENDING' || row.status === 'PARTIAL' || row.status === 'OVERDUE') && (
                    <button
                      onClick={(e) => handlePay(row.id, e)}
                      disabled={payingId === row.id}
                      className="p-1.5 rounded-lg text-success/70 hover:text-success hover:bg-success/10 transition-colors disabled:opacity-50"
                      title="Registrar pago"
                    >
                      <CreditCard className="w-4 h-4" />
                    </button>
                  )}
                  {row.status !== 'PAID' && row.status !== 'CANCELLED' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setCancelDialogId(row.id); }}
                      className="p-1.5 rounded-lg text-error/70 hover:text-error hover:bg-error/10 transition-colors"
                      title="Cancelar factura"
                    >
                      <XCircle className="w-4 h-4" />
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
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} limit={limit} />
        </motion.div>
      )}

      {/* Cancel dialog */}
      <ConfirmDialog
        open={!!cancelDialogId}
        onClose={() => setCancelDialogId(null)}
        onConfirm={handleCancel}
        title="Cancelar Factura"
        description="¿Estás seguro de que deseas cancelar esta factura? Esta acción no se puede deshacer."
        confirmLabel="Cancelar Factura"
        cancelLabel="Regresar"
        variant="destructive"
      />
    </motion.div>
  );
}
