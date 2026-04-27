'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, FileText, Building2, Calendar, Tag, Percent, Receipt } from 'lucide-react';
import { useInvoices, useInvoice } from '../hooks/useInvoices';
import { useAppStore } from '@/lib/stores/useAppStore';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { StatusBadge, PageLoader } from '@/components/ui/vintage-ui';
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Invoice } from '@/lib/api/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function getInvoiceStatus(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    PAID: 'success', PARTIAL: 'info', PENDING: 'warning', OVERDUE: 'error',
    CANCELLED: 'neutral', DRAFT: 'neutral',
  };
  return map[status] || 'neutral';
}

export function InvoiceDetail() {
  const viewParams = useAppStore((s) => s.viewParams);
  const navigate = useAppStore((s) => s.navigate);
  const { getInvoice, payInvoice } = useInvoices();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const { invoice: fetchedInvoice, isLoading: fetchLoading } = useInvoice(viewParams.id || '');

  useEffect(() => {
    if (!viewParams.id) {
       navigate('invoices');
       return;
    }
    if (fetchedInvoice) {
      setInvoice(fetchedInvoice);
    }
  }, [viewParams.id, fetchedInvoice, navigate]);

  useEffect(() => {
    setLoading(fetchLoading);
  }, [fetchLoading]);

  const handlePay = useCallback(async () => {
    if (!invoice) return;
    setPaying(true);
    try {
      const updatedInvoice = await payInvoice({ 
        id: invoice.id, 
        amount: invoice.balanceDue,
        description: `Pago registrado desde detalle - ${new Date().toLocaleDateString()}`
      });
      if (updatedInvoice) {
        toast.success('Pago registrado correctamente');
        setInvoice(updatedInvoice as any);
      } else {
        toast.error('No se pudo registrar el pago');
      }
    } catch {
      toast.error('Error al registrar el pago');
    } finally {
      setPaying(false);
    }
  }, [invoice, payInvoice, getInvoice]);

  if (loading) return <PageLoader text="Cargando factura..." />;

  if (!invoice) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <FileText className="w-12 h-12 text-vintage-300" />
        <p className="text-vintage-600">Factura no encontrada</p>
        <PastelButton variant="outline" onClick={() => navigate('invoices')}>Volver a Facturas</PastelButton>
      </div>
    );
  }

  const canPay = invoice.status === 'PENDING' || invoice.status === 'PARTIAL' || invoice.status === 'OVERDUE';

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('invoices')}
            className="p-2 rounded-xl hover:bg-vintage-100 text-vintage-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-playfair text-vintage-800">{invoice.number}</h1>
              <StatusBadge status={getInvoiceStatus(invoice.status)} label={getStatusLabel(invoice.status)} size="md" />
            </div>
            <p className="text-sm text-vintage-500">
              {invoice.invoiceType === 'SALE' ? 'Factura de Venta' : 'Factura de Compra'}
              {invoice.description ? ` — ${invoice.description}` : ''}
            </p>
          </div>
        </div>
        {canPay && (
          <PastelButton variant="success" onClick={handlePay} loading={paying} className="gap-2">
            <CreditCard className="w-4 h-4" />
            Registrar Pago
          </PastelButton>
        )}
      </motion.div>

      {/* Info cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <VintageCard hover={false} className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-vintage-500" />
            <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Tercero</p>
          </div>
          <p className="text-sm font-semibold text-vintage-800">{invoice.thirdParty?.name || '—'}</p>
          <p className="text-xs text-vintage-500 mt-1">{invoice.thirdParty?.taxId || ''}</p>
        </VintageCard>
        <VintageCard hover={false} className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-vintage-500" />
            <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Fechas</p>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-vintage-500">Emisión</p>
              <p className="text-sm font-medium text-vintage-800">{formatDate(invoice.issueDate)}</p>
            </div>
            <div>
              <p className="text-xs text-vintage-500">Vencimiento</p>
              <p className="text-sm font-medium text-vintage-800">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>
        </VintageCard>
        <VintageCard hover={false} className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-vintage-500" />
            <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Tipo</p>
          </div>
          <span className={cn(
            'inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full',
            invoice.invoiceType === 'SALE' ? 'bg-success/15 text-success' : 'bg-peach/30 text-vintage-800',
          )}>
            {getStatusLabel(invoice.invoiceType)}
          </span>
        </VintageCard>
        <VintageCard hover={false} className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4 text-vintage-500" />
            <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Total</p>
          </div>
          <p className="text-xl font-playfair text-vintage-800 font-bold">{formatCurrency(invoice.totalAmount, 'NIO')}</p>
          {invoice.balanceDue > 0 && (
            <p className="text-xs text-warning font-medium mt-1">Saldo pendiente: {formatCurrency(invoice.balanceDue, 'NIO')}</p>
          )}
        </VintageCard>
      </motion.div>

      {/* Lines table */}
      <motion.div variants={itemVariants}>
        <VintageCard hover={false} className="overflow-hidden">
          <div className="p-4 border-b border-vintage-100">
            <h2 className="text-lg font-playfair text-vintage-800">Conceptos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-vintage-200 bg-vintage-50/50">
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-700 uppercase text-left">#</th>
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-700 uppercase text-left">Descripción</th>
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-700 uppercase text-center">Cant.</th>
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-700 uppercase text-right">Precio Unit.</th>
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-700 uppercase text-right">Subtotal</th>
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-700 uppercase text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vintage-100">
                {(invoice.lines || []).map((line, idx) => (
                  <motion.tr
                    key={line.id || idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-vintage-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-vintage-500">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-vintage-800">{line.description}</p>
                      {line.taxRate > 0 && (
                        <p className="text-xs text-vintage-500 mt-0.5">IVA {line.taxRate}%</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-vintage-700 text-center">{line.quantity}</td>
                    <td className="px-4 py-3 text-sm font-mono text-vintage-700 text-right">{formatCurrency(line.unitPrice, 'NIO')}</td>
                    <td className="px-4 py-3 text-sm font-mono text-vintage-600 text-right">{formatCurrency(line.subtotal, 'NIO')}</td>
                    <td className="px-4 py-3 text-sm font-mono text-vintage-800 font-semibold text-right">{formatCurrency(line.total, 'NIO')}</td>
                  </motion.tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-vintage-200 bg-vintage-50/30">
                  <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-vintage-700 text-right">Subtotal</td>
                  <td colSpan={2} className="px-4 py-3 text-sm font-mono text-vintage-700 text-right">{formatCurrency(invoice.subtotal, 'NIO')}</td>
                </tr>
                {(invoice.taxEntries || []).map((tax) => (
                  <tr key={tax.id} className="border-t border-vintage-100">
                    <td colSpan={4} className="px-4 py-2 text-sm text-vintage-600 text-right flex items-center justify-end gap-1">
                      <Percent className="w-3 h-3" />
                      {tax.taxName}
                    </td>
                    <td colSpan={2} className="px-4 py-2 text-sm font-mono text-vintage-600 text-right">{formatCurrency(tax.taxAmount, 'NIO')}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-vintage-300 bg-vintage-100/50">
                  <td colSpan={4} className="px-4 py-3 text-base font-bold text-vintage-800 text-right">Total</td>
                  <td colSpan={2} className="px-4 py-3 text-base font-mono font-bold text-vintage-800 text-right">{formatCurrency(invoice.totalAmount, 'NIO')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </VintageCard>
      </motion.div>

      {/* Payment schedule */}
      {invoice.paymentSchedule && invoice.paymentSchedule.length > 0 && (
        <motion.div variants={itemVariants}>
          <VintageCard hover={false} className="overflow-hidden">
            <div className="p-4 border-b border-vintage-100">
              <h2 className="text-lg font-playfair text-vintage-800">Programa de Pagos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-vintage-200 bg-vintage-50/50">
                    <th className="px-4 py-3 text-xs font-semibold text-vintage-700 uppercase text-left">Fecha Vencimiento</th>
                    <th className="px-4 py-3 text-xs font-semibold text-vintage-700 uppercase text-right">Monto</th>
                    <th className="px-4 py-3 text-xs font-semibold text-vintage-700 uppercase text-right">Pagado</th>
                    <th className="px-4 py-3 text-xs font-semibold text-vintage-700 uppercase text-right">Saldo</th>
                    <th className="px-4 py-3 text-xs font-semibold text-vintage-700 uppercase text-center">Estado</th>
                    <th className="px-4 py-3 text-xs font-semibold text-vintage-700 uppercase text-left">Método</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vintage-100">
                  {(invoice.paymentSchedule || []).map((ps, idx) => {
                    const balance = ps.amount - ps.paidAmount;
                    return (
                      <motion.tr
                        key={ps.id || idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="hover:bg-vintage-50/50"
                      >
                        <td className="px-4 py-3 text-sm text-vintage-700">{formatDate(ps.dueDate)}</td>
                        <td className="px-4 py-3 text-sm font-mono text-vintage-700 text-right">{formatCurrency(ps.amount, 'NIO')}</td>
                        <td className="px-4 py-3 text-sm font-mono text-success text-right">{formatCurrency(ps.paidAmount, 'NIO')}</td>
                        <td className="px-4 py-3 text-sm font-mono text-right">
                          <span className={balance > 0 ? 'text-warning font-semibold' : 'text-vintage-500'}>
                            {formatCurrency(balance, 'NIO')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge
                            status={
                              ps.status === 'PAID' ? 'success' :
                              ps.status === 'OVERDUE' ? 'error' : 'warning'
                            }
                            label={ps.status === 'PAID' ? 'Pagado' : ps.status === 'OVERDUE' ? 'Vencido' : 'Pendiente'}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-vintage-600">{ps.paymentMethod || '—'}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </VintageCard>
        </motion.div>
      )}

      {/* Footer actions */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <PastelButton variant="ghost" onClick={() => navigate('invoices')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Facturas
        </PastelButton>
        <p className="text-xs text-vintage-400">Creada: {formatDate(invoice.createdAt, 'dd/MM/yyyy HH:mm')}</p>
      </motion.div>
    </motion.div>
  );
}
