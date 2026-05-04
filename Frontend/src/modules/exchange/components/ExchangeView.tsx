'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Calculator, Plus, Save, History as HistoryIcon, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { FloatingInput } from '@/components/ui/floating-input';
import { formatDate } from '@/lib/utils/format';
import { useExchangeRates } from '../hooks/useExchangeRates';

import { exportExchangeExcel } from '@/lib/utils/export';
import { useAppStore } from '@/lib/stores/useAppStore';

export function ExchangeView() {
  const currentCompany = useAppStore(s => s.currentCompany);
  const { exchangeRates: rates, isLoading: loading, createExchangeRate, isCreating } = useExchangeRates();

  const handleExport = async () => {
    if (!rates.length) return;
    toast.loading('Generando reporte...', { id: 'export-loading', duration: 8000 });
    await exportExchangeExcel(rates, currentCompany?.name || 'GANESHA');
    toast.dismiss(toastId);
    toast.success('Historial de divisas exportado');
  };
  const [amount, setAmount] = useState('1000');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('NIO');
  const [convertedAmount, setConvertedAmount] = useState<string | null>(null);

  // New rate form state
  const [newFrom, setNewFrom] = useState('USD');
  const [newTo, setNewTo] = useState('NIO');
  const [newRate, setNewRate] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  const getRate = (from: string, to: string): number => {
    if (from === to) return 1;
    // Sort by date desc to get latest
    const sorted = [...(rates || [])].sort((a, b) => new Date(b.date || b.effectiveDate).getTime() - new Date(a.date || a.effectiveDate).getTime());
    
    const direct = sorted.find(r => r.fromCurrency === from && r.toCurrency === to);
    if (direct) return Number(direct.rate);
    
    const reverse = sorted.find(r => r.fromCurrency === to && r.toCurrency === from);
    if (reverse) return 1 / Number(reverse.rate);

    // Fallback static rates if API doesn't have them
    const fallbackRates: Record<string, Record<string, number>> = {
      'USD': { 'NIO': 36.62, 'MXN': 17.05, 'EUR': 0.92 },
      'NIO': { 'USD': 1 / 36.62 },
      'MXN': { 'USD': 1 / 17.05 },
    };

    if (fallbackRates[from]?.[to]) return fallbackRates[from][to];

    // Try via USD
    const toUsd = getRate(from, 'USD');
    const usdTo = getRate('USD', to);
    if (toUsd && usdTo) return toUsd * usdTo;

    return 0;
  };

  const handleConvert = () => {
    const val = parseFloat(amount);
    if (isNaN(val)) { toast.error('Ingresa un monto válido'); return; }
    const rate = getRate(fromCurrency, toCurrency);
    if (rate === 0) { 
      toast.error(`No hay tasa disponible para ${fromCurrency}/${toCurrency}`);
      return; 
    }
    const result = val * rate;
    setConvertedAmount(result.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 4 }));
    toast.success(`Tasa aplicada: ${rate.toFixed(4)}`);
  };

  const handleCreateRate = async () => {
    if (!newRate || parseFloat(newRate) <= 0) return toast.error('Ingresa una tasa válida');
    if (newFrom === newTo) return toast.error('Las monedas deben ser distintas');

    try {
      await createExchangeRate({
        fromCurrency: newFrom,
        toCurrency: newTo,
        rate: parseFloat(newRate),
        date: newDate,
        source: 'MANUAL'
      });
      toast.success('Tipo de cambio registrado');
      setNewRate('');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    }
  };

  const currencies = ['USD', 'NIO', 'MXN', 'EUR', 'GBP', 'CAD', 'JPY'];

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-vintage-900">Tipos de Cambio</h2>
          <p className="text-sm text-vintage-600 mt-1">Gestión de paridades y conversor multi-moneda</p>
        </div>
        <div className="flex gap-2">
          <PastelButton variant="outline" onClick={handleExport} className="gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            Exportar Excel
          </PastelButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Converter */}
        <VintageCard className="h-full">
          <h3 className="text-sm font-semibold text-vintage-800 mb-4 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-vintage-500" />
            Conversor de Divisas
          </h3>
          <div className="space-y-4">
            <FloatingInput label="Monto" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <div className="flex items-center gap-3">
              <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)} className="flex-1 px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400">
                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="p-2 rounded-full bg-vintage-100"><ArrowLeftRight className="w-4 h-4 text-vintage-500" /></div>
              <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)} className="flex-1 px-3 py-2.5 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400">
                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <AnimatePresence>
              {convertedAmount && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-success/5 border border-success/20 rounded-xl">
                  <p className="text-xs text-vintage-500 uppercase font-bold tracking-tight mb-1">Resultado Estimado</p>
                  <p className="text-2xl font-playfair font-bold text-success">{toCurrency} {convertedAmount}</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            <PastelButton onClick={handleConvert} className="w-full">Calcular Conversión</PastelButton>
          </div>
        </VintageCard>

        {/* Create Form */}
        <VintageCard className="h-full">
          <h3 className="text-sm font-semibold text-vintage-800 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-vintage-500" />
            Registrar Nueva Tasa
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-vintage-500 uppercase mb-1">De</label>
                <select value={newFrom} onChange={e => setNewFrom(e.target.value)} className="w-full px-3 py-2 text-sm bg-card border border-vintage-200 rounded-xl outline-none focus:ring-2 focus:ring-vintage-400">
                  {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-vintage-500 uppercase mb-1">A</label>
                <select value={newTo} onChange={e => setNewTo(e.target.value)} className="w-full px-3 py-2 text-sm bg-card border border-vintage-200 rounded-xl outline-none focus:ring-2 focus:ring-vintage-400">
                  {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-[10px] font-bold text-vintage-500 uppercase mb-1">Tasa de Cambio</label>
                  <input type="number" step="0.0001" value={newRate} onChange={e => setNewRate(e.target.value)} className="w-full px-3 py-2 text-sm bg-card border border-vintage-200 rounded-xl outline-none focus:ring-2 focus:ring-vintage-400" />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-vintage-500 uppercase mb-1">Fecha</label>
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full px-3 py-2 text-sm bg-card border border-vintage-200 rounded-xl outline-none focus:ring-2 focus:ring-vintage-400" />
               </div>
            </div>
            <PastelButton onClick={handleCreateRate} loading={isCreating} variant="success" className="w-full gap-2">
              <Save className="w-4 h-4" />
              Guardar en Historial
            </PastelButton>
          </div>
        </VintageCard>
      </div>

      <VintageCard className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-vintage-100 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-vintage-800 flex items-center gap-2">
            <HistoryIcon className="w-4 h-4 text-vintage-500" />
            Historial de Paridades
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-vintage-500">
            <TrendingUp className="w-3.5 h-3.5 text-success" />
            <span>Últimas 10 entradas</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead>
              <tr className="bg-vintage-50/50">
                <th className="px-5 py-3 text-[10px] font-bold text-vintage-500 uppercase">Paridad Divisas</th>
                <th className="px-5 py-3 text-[10px] font-bold text-vintage-500 uppercase text-right">Valor Tasa</th>
                <th className="px-5 py-3 text-[10px] font-bold text-vintage-500 uppercase">Fecha Entrada</th>
                <th className="px-5 py-3 text-[10px] font-bold text-vintage-500 uppercase">Fuente Datos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vintage-100 italic">
              {(rates || []).slice(0, 10).map((r, i) => (
                <tr key={r.id} className="hover:bg-vintage-50 transition-colors group">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                       <span className="font-mono text-xs font-bold text-vintage-700 bg-vintage-100/50 px-2 py-0.5 rounded">{r.fromCurrency}</span>
                       <ArrowLeftRight className="w-3 h-3 text-vintage-300 group-hover:text-vintage-500" />
                       <span className="font-mono text-xs font-bold text-vintage-700 bg-vintage-100/50 px-2 py-0.5 rounded">{r.toCurrency}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="font-mono text-sm font-bold text-vintage-900">{Number(r.rate).toFixed(4)}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-vintage-600">{formatDate(r.date || r.effectiveDate)}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-vintage-100 text-[10px] font-medium text-vintage-500 uppercase">
                      {r.source || 'Manual'}
                    </span>
                  </td>
                </tr>
              ))}
              {(!rates || rates.length === 0) && (
                <tr>
                   <td colSpan={4} className="px-5 py-8 text-center text-vintage-400 text-sm italic">
                      No hay registros en el historial. El conversor usará tasas predefinidas.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </VintageCard>
    </div>
  );
}
