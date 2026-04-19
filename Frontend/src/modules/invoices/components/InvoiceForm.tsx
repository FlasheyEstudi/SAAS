'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { useInvoices } from '../hooks/useInvoices';
import { useAppStore } from '@/lib/stores/useAppStore';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { FloatingInput } from '@/components/ui/floating-input';
import { FloatingSelect } from '@/components/ui/floating-input';
import { PageLoader } from '@/components/ui/vintage-ui';
import { formatCurrency } from '@/lib/utils/format';
import { toast } from 'sonner';
import type { InvoiceLine } from '@/lib/api/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface LineRow {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

const emptyLine: LineRow = { description: '', quantity: 1, unitPrice: 0, taxRate: 15 };

export function InvoiceForm() {
  const navigate = useAppStore((s) => s.navigate);
  const { thirdParties, isLoading, createInvoice } = useInvoices();

  const [thirdPartyId, setThirdPartyId] = useState('');
  const [invoiceType, setInvoiceType] = useState<'SALE' | 'PURCHASE'>('SALE');
  const [description, setDescription] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [lines, setLines] = useState<LineRow[]>([{ ...emptyLine }]);
  const [saving, setSaving] = useState(false);

  // Filter third parties based on invoice type
  const filteredThirdParties = useMemo(() => {
    return thirdParties.filter((tp) => {
      if (invoiceType === 'SALE') return tp.type === 'CLIENT' || tp.type === 'BOTH';
      return tp.type === 'SUPPLIER' || tp.type === 'BOTH';
    });
  }, [thirdParties, invoiceType]);

  // Computed totals
  const computedLines = useMemo(() => {
    return lines.map((l) => {
      const subtotal = l.quantity * l.unitPrice;
      const taxAmount = subtotal * (l.taxRate / 100);
      return { ...l, subtotal, taxAmount, total: subtotal + taxAmount };
    });
  }, [lines]);

  const subtotal = computedLines.reduce((s, l) => s + l.subtotal, 0);
  const taxAmount = computedLines.reduce((s, l) => s + l.taxAmount, 0);
  const totalAmount = subtotal + taxAmount;

  const addLine = useCallback(() => {
    setLines((prev) => [...prev, { ...emptyLine }]);
  }, []);

  const removeLine = useCallback((idx: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }, [lines.length]);

  const updateLine = useCallback((idx: number, field: keyof LineRow, value: string | number) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)),
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!thirdPartyId) { toast.error('Selecciona un tercero'); return; }
    if (!invoiceDate) { toast.error('Ingresa la fecha de factura'); return; }
    if (!dueDate) { toast.error('Ingresa la fecha de vencimiento'); return; }
    const validLines = lines.filter((l) => l.description.trim() && l.unitPrice > 0);
    if (validLines.length === 0) { toast.error('Agrega al menos una línea con descripción y precio'); return; }

    setSaving(true);
    try {
      const invoice = await createInvoice({
        thirdPartyId,
        invoiceType,
        description: description || undefined,
        invoiceDate,
        dueDate,
        lines: validLines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
        })),
      });
      if (invoice) {
        toast.success('Factura creada correctamente');
        navigate('invoice-detail', { id: invoice.id });
      } else {
        toast.error('No se pudo crear la factura');
      }
    } catch {
      toast.error('Error al crear la factura');
    } finally {
      setSaving(false);
    }
  }, [thirdPartyId, invoiceType, description, invoiceDate, dueDate, lines, createInvoice, navigate]);

  if (isLoading) return <PageLoader text="Cargando datos..." />;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <button
          onClick={() => navigate('invoices')}
          className="p-2 rounded-xl hover:bg-vintage-100 text-vintage-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-playfair text-vintage-800">Nueva Factura</h1>
          <p className="text-sm text-vintage-500">Crear una nueva factura de {invoiceType === 'SALE' ? 'venta' : 'compra'}</p>
        </div>
      </motion.div>

      {/* Form header card */}
      <motion.div variants={itemVariants}>
        <VintageCard hover={false} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FloatingSelect
              label="Tercero"
              value={thirdPartyId}
              onChange={(e) => setThirdPartyId(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {filteredThirdParties.map((tp) => (
                <option key={tp.id} value={tp.id}>{tp.name}</option>
              ))}
            </FloatingSelect>

            <FloatingSelect
              label="Tipo de Factura"
              value={invoiceType}
              onChange={(e) => {
                setInvoiceType(e.target.value as 'SALE' | 'PURCHASE');
                setThirdPartyId('');
              }}
            >
              <option value="SALE">Venta (CFE)</option>
              <option value="PURCHASE">Compra (CPR)</option>
            </FloatingSelect>

            <FloatingInput
              label="Fecha de Factura"
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />

            <FloatingInput
              label="Fecha de Vencimiento"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <FloatingInput
            label="Descripción / Concepto"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción general de la factura..."
          />
        </VintageCard>
      </motion.div>

      {/* Invoice lines */}
      <motion.div variants={itemVariants}>
        <VintageCard hover={false} className="overflow-hidden">
          <div className="p-4 border-b border-vintage-100">
            <h2 className="text-lg font-playfair text-vintage-800">Conceptos</h2>
            <p className="text-xs text-vintage-500">Agrega los productos o servicios de la factura</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-vintage-200 bg-vintage-50/50">
                  <th className="px-4 py-2.5 text-xs font-semibold text-vintage-700 uppercase text-left w-8">#</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-vintage-700 uppercase text-left">Descripción</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-vintage-700 uppercase text-center w-24">Cantidad</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-vintage-700 uppercase text-right w-36">Precio Unitario</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-vintage-700 uppercase text-center w-28">Tasa IVA</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-vintage-700 uppercase text-right w-32">Subtotal</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-vintage-700 uppercase text-right w-32">Total</th>
                  <th className="px-4 py-2.5 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vintage-100">
                {lines.map((line, idx) => {
                  const lSubtotal = line.quantity * line.unitPrice;
                  const lTax = lSubtotal * (line.taxRate / 100);
                  const lTotal = lSubtotal + lTax;
                  return (
                    <tr key={idx} className="hover:bg-vintage-50/50 transition-colors">
                      <td className="px-4 py-2 text-sm text-vintage-500">{idx + 1}</td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) => updateLine(idx, 'description', e.target.value)}
                          placeholder="Descripción del concepto..."
                          className="w-full px-3 py-1.5 text-sm bg-transparent border border-vintage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-vintage-400 focus:border-vintage-400"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={line.quantity}
                          onChange={(e) => updateLine(idx, 'quantity', Number(e.target.value))}
                          className="w-full px-3 py-1.5 text-sm bg-transparent border border-vintage-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-vintage-400"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unitPrice || ''}
                          onChange={(e) => updateLine(idx, 'unitPrice', Number(e.target.value))}
                          placeholder="0.00"
                          className="w-full px-3 py-1.5 text-sm bg-transparent border border-vintage-200 rounded-lg text-right font-mono focus:outline-none focus:ring-2 focus:ring-vintage-400"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={line.taxRate}
                          onChange={(e) => updateLine(idx, 'taxRate', Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-sm bg-transparent border border-vintage-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-vintage-400"
                        >
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={15}>15%</option>
                        </select>
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-mono text-vintage-600">
                        {formatCurrency(lSubtotal, 'NIO')}
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-mono text-vintage-800 font-semibold">
                        {formatCurrency(lTotal, 'NIO')}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {lines.length > 1 && (
                          <button
                            onClick={() => removeLine(idx)}
                            className="p-1 rounded text-error/60 hover:text-error hover:bg-error/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add line + totals */}
          <div className="p-4 border-t border-vintage-200 bg-vintage-50/30">
            <div className="flex items-center justify-between mb-4">
              <PastelButton variant="outline" onClick={addLine} className="gap-2 text-sm">
                <Plus className="w-4 h-4" />
                Agregar Concepto
              </PastelButton>
            </div>
            <div className="flex flex-col items-end gap-1 text-sm">
              <div className="flex items-center gap-6">
                <span className="text-vintage-600">Subtotal:</span>
                <span className="font-mono text-vintage-700 w-36 text-right">{formatCurrency(subtotal, 'NIO')}</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-vintage-600">IVA ({formatCurrency(taxAmount, 'NIO')}):</span>
                <span className="font-mono text-vintage-700 w-36 text-right">{formatCurrency(taxAmount, 'NIO')}</span>
              </div>
              <div className="flex items-center gap-6 border-t border-vintage-300 pt-1 mt-1">
                <span className="text-vintage-800 font-semibold text-base">Total:</span>
                <span className="font-mono text-vintage-800 font-bold text-lg w-36 text-right">{formatCurrency(totalAmount, 'NIO')}</span>
              </div>
            </div>
          </div>
        </VintageCard>
      </motion.div>

      {/* Action buttons */}
      <motion.div variants={itemVariants} className="flex justify-end gap-3">
        <PastelButton variant="outline" onClick={() => navigate('invoices')}>
          Cancelar
        </PastelButton>
        <PastelButton onClick={handleSave} loading={saving} className="gap-2">
          <Save className="w-4 h-4" />
          Guardar Factura
        </PastelButton>
      </motion.div>
    </motion.div>
  );
}
