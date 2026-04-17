'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { FloatingInput } from '@/components/ui/floating-input';
import { formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

import { useExchangeRates } from '../hooks/useExchangeRates';

export function ExchangeView() {
  const { exchangeRates: rates, isLoading: loading } = useExchangeRates();
  const [amount, setAmount] = useState('1000');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('MXN');
  const [convertedAmount, setConvertedAmount] = useState<string | null>(null);

  const getRate = (from: string, to: string): number => {
    if (from === to) return 1;
    const direct = (rates || []).find(r => r.fromCurrency === from && r.toCurrency === to);
    if (direct) return direct.rate;
    const reverse = (rates || []).find(r => r.fromCurrency === to && r.toCurrency === from);
    if (reverse) return 1 / reverse.rate;
    // Try via USD
    const toUsd = (rates || []).find(r => r.fromCurrency === from && r.toCurrency === 'USD');
    const usdTo = (rates || []).find(r => r.fromCurrency === 'USD' && r.toCurrency === to);
    if (toUsd && usdTo) return toUsd.rate * usdTo.rate;
    return 0;
  };

  const handleConvert = () => {
    const val = parseFloat(amount);
    if (isNaN(val)) { toast.error('Ingresa un monto válido'); return; }
    const rate = getRate(fromCurrency, toCurrency);
    if (rate === 0) { toast.error('No se encontró tipo de cambio'); return; }
    const result = val * rate;
    setConvertedAmount(result.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 4 }));
    toast.success(`${fromCurrency} → ${toCurrency}: ${rate.toFixed(4)}`);
  };

  const currencies = ['USD', 'MXN', 'NIO', 'EUR', 'GBP', 'CAD', 'JPY'];

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-playfair font-bold text-vintage-900">Tipos de Cambio</h2><p className="text-sm text-vintage-600 mt-1">Tipos de cambio y conversor de divisas</p></div>

      <VintageCard>
        <h3 className="text-sm font-semibold text-vintage-800 mb-4 flex items-center gap-2"><Calculator className="w-4 h-4 text-vintage-500" />Conversor de Divisas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          <FloatingInput label="Monto" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="flex flex-col items-center gap-2">
            <div className="w-full">
              <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)} className="w-full px-3 py-3 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400">
                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="w-8 h-8 rounded-full bg-vintage-200 flex items-center justify-center"><ArrowLeftRight className="w-4 h-4 text-vintage-600" /></div>
            <div className="w-full">
              <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)} className="w-full px-3 py-3 text-sm bg-card border border-vintage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400">
                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {convertedAmount && <div className="px-3 py-3 bg-success/10 border border-success/20 rounded-xl"><p className="text-lg font-bold text-success">{toCurrency} {convertedAmount}</p><p className="text-xs text-vintage-500">Tasa: {getRate(fromCurrency, toCurrency).toFixed(4)}</p></div>}
            <PastelButton onClick={handleConvert} className="w-full">Convertir</PastelButton>
          </div>
        </div>
      </VintageCard>

      <VintageCard className="p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-3"><h3 className="text-sm font-semibold text-vintage-800">Tabla de Tipos de Cambio</h3></div>
        <table className="w-full">
          <thead><tr className="border-b border-vintage-200 bg-vintage-50/50"><th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">De</th><th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">A</th><th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-right">Tipo de Cambio</th><th className="px-4 py-3 text-xs font-semibold text-vintage-700 text-left">Fecha</th></tr></thead>
          <tbody className="divide-y divide-vintage-100">
            {(rates || []).map((r, i) => (
              <motion.tr key={r.id} className="hover:bg-vintage-50 cursor-pointer transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                onClick={() => { setFromCurrency(r.fromCurrency); setToCurrency(r.toCurrency); setAmount('1'); handleConvert(); }}>
                <td className="px-4 py-3"><span className="font-mono text-sm font-medium text-vintage-700 bg-vintage-100 px-2 py-0.5 rounded">{r.fromCurrency}</span></td>
                <td className="px-4 py-3"><span className="font-mono text-sm font-medium text-vintage-700 bg-vintage-100 px-2 py-0.5 rounded">{r.toCurrency}</span></td>
                <td className="px-4 py-3 text-sm font-mono text-vintage-800 text-right font-medium">{r.rate.toFixed(4)}</td>
                <td className="px-4 py-3 text-xs text-vintage-500">{formatDate(r.effectiveDate)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </VintageCard>
    </div>
  );
}
