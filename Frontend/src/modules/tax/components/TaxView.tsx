'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Percent, Plus, Receipt, History, Edit2, TrendingUp } from 'lucide-react';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { FloatingInput } from '@/components/ui/floating-input';
import { StatusBadge, VintageTabs, EmptyState } from '@/components/ui/vintage-ui';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { useTaxes, TaxRate } from '../hooks/useTaxes';

export function TaxView() {
  const { rates, entries, isLoading, createRate, updateRate, isCreating } = useTaxes();
  const [activeTab, setActiveTab] = useState('rates');
  const [showRateForm, setShowRateForm] = useState(false);
  const [editingRate, setEditingRate] = useState<TaxRate | null>(null);
  
  const [rateForm, setRateForm] = useState({
    name: '',
    rate: 0,
    type: 'VAT' as TaxRate['type'],
    description: '',
  });

  const openCreateRate = () => {
    setEditingRate(null);
    setRateForm({ name: '', rate: 0, type: 'VAT', description: '' });
    setShowRateForm(true);
  };

  const handleSaveRate = async () => {
    if (!rateForm.name || rateForm.rate === undefined) return;
    if (editingRate) {
      await updateRate({ id: editingRate.id, data: rateForm });
    } else {
      await createRate(rateForm);
    }
    setShowRateForm(false);
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-vintage-900">Impuestos</h2>
          <p className="text-sm text-vintage-600 mt-1">Configuración de tasas y registro de impuestos</p>
        </div>
        {activeTab === 'rates' && (
          <PastelButton onClick={openCreateRate}><Plus className="w-4 h-4 mr-2" />Nueva Tasa</PastelButton>
        )}
      </div>

      <VintageTabs
        tabs={[
          { id: 'rates', label: 'Tasas y Configuración', icon: <Percent className="w-4 h-4" /> },
          { id: 'entries', label: 'Registro de Impuestos', icon: <Receipt className="w-4 h-4" /> },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'rates' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rates.map((rate) => (
            <VintageCard key={rate.id} className="relative group">
              <div className="flex items-start justify-between">
                <div>
                  <StatusBadge status={rate.type === 'VAT' ? 'success' : 'info'} label={rate.type === 'VAT' ? 'IVA' : rate.type === 'WH' ? 'Retención' : 'Otro'} size="sm" />
                  <h3 className="text-lg font-bold text-vintage-800 mt-2">{rate.name}</h3>
                  <p className="text-3xl font-playfair font-bold text-vintage-900 mt-1">{rate.rate}%</p>
                  <p className="text-xs text-vintage-500 mt-2">{rate.description || 'Sin descripción'}</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingRate(rate);
                    setRateForm({ name: rate.name, rate: rate.rate, type: rate.type, description: rate.description || '' });
                    setShowRateForm(true);
                  }}
                  className="p-2 rounded-lg hover:bg-vintage-100 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="w-4 h-4 text-vintage-600" />
                </button>
              </div>
            </VintageCard>
          ))}
          {rates.length === 0 && (
            <div className="col-span-full py-12 text-center text-vintage-500">No hay tasas configuradas</div>
          )}
        </div>
      ) : (
        <VintageCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-vintage-200 bg-vintage-50/50">
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Fecha</th>
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Impuesto</th>
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-right">Base</th>
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-right">Monto</th>
                  <th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Referencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vintage-100">
                {entries.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-vintage-500">No hay registros de impuestos</td></tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-vintage-50">
                      <td className="px-4 py-3 text-sm text-vintage-600">{formatDate(entry.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-vintage-800">{entry.taxRate.name}</span>
                        <span className="ml-2 text-xs text-vintage-400">({entry.taxRate.rate}%)</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(entry.baseAmount)}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-bold text-vintage-800">{formatCurrency(entry.taxAmount)}</td>
                      <td className="px-4 py-3 text-xs text-vintage-500 italic">Inv: {entry.invoiceId.slice(-8)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </VintageCard>
      )}

      {showRateForm && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowRateForm(false)} />
          <motion.div className="relative bg-card rounded-2xl p-6 max-w-md w-full shadow-xl border border-vintage-200" initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
            <h3 className="text-lg font-playfair font-bold text-vintage-800 mb-4">{editingRate ? 'Editar' : 'Nueva'} Tasa de Impuesto</h3>
            <div className="space-y-4">
              <FloatingInput label="Nombre del Impuesto" value={rateForm.name} onChange={(e) => setRateForm({ ...rateForm, name: e.target.value })} />
              <FloatingInput label="Tasa (%)" type="number" value={rateForm.rate} onChange={(e) => setRateForm({ ...rateForm, rate: Number(e.target.value) })} />
              <div className="relative">
                <select value={rateForm.type} onChange={(e) => setRateForm({ ...rateForm, type: e.target.value as any })} className="peer w-full px-3 pt-5 pb-2 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 appearance-none">
                  <option value="VAT">IVA (Valor Agregado)</option>
                  <option value="WH">Retención</option>
                  <option value="OTHER">Otro</option>
                </select>
                <label className="absolute left-3 top-1.5 text-xs text-vintage-500 font-medium pointer-events-none">Tipo</label>
              </div>
              <FloatingInput label="Descripción" value={rateForm.description} onChange={(e) => setRateForm({ ...rateForm, description: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowRateForm(false)} className="px-4 py-2 text-sm rounded-xl border border-vintage-200 text-vintage-700 hover:bg-vintage-50">Cancelar</button>
              <PastelButton onClick={handleSaveRate} loading={isCreating}>{editingRate ? 'Guardar' : 'Crear'}</PastelButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
