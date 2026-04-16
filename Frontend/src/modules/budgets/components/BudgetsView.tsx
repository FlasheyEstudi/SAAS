'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PiggyBank, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { StatusBadge } from '@/components/ui/vintage-ui';
import { formatCurrency } from '@/lib/utils/format';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface BudgetLine { account: string; budgeted: number; actual: number; }
interface Budget { id: string; name: string; period: string; status: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'CLOSED'; totalBudgeted: number; totalActual: number; lines: BudgetLine[]; }

const mockBudgets: Budget[] = [
  { id: '1', name: 'Presupuesto Q3 2025', period: 'Jul-Sep 2025', status: 'ACTIVE', totalBudgeted: 1920000, totalActual: 1650000, lines: [
    { account: 'Nóminas', budgeted: 850000, actual: 820000 }, { account: 'Servicios', budgeted: 320000, actual: 295000 },
    { account: 'Arrendamiento', budgeted: 240000, actual: 240000 }, { account: 'Impuestos', budgeted: 200000, actual: 180000 },
    { account: 'Gastos Admin', budgeted: 310000, actual: 115000 },
  ]},
  { id: '2', name: 'Presupuesto Q4 2025', period: 'Oct-Dic 2025', status: 'APPROVED', totalBudgeted: 2050000, totalActual: 480000, lines: [
    { account: 'Nóminas', budgeted: 880000, actual: 280000 }, { account: 'Servicios', budgeted: 340000, actual: 95000 },
    { account: 'Arrendamiento', budgeted: 240000, actual: 80000 }, { account: 'Impuestos', budgeted: 220000, actual: 25000 },
    { account: 'Gastos Admin', budgeted: 370000, actual: 0 },
  ]},
  { id: '3', name: 'Presupuesto Q2 2025', period: 'Abr-Jun 2025', status: 'CLOSED', totalBudgeted: 1850000, totalActual: 1780000, lines: [
    { account: 'Nóminas', budgeted: 820000, actual: 810000 }, { account: 'Servicios', budgeted: 300000, actual: 315000 },
    { account: 'Arrendamiento', budgeted: 240000, actual: 240000 }, { account: 'Impuestos', budgeted: 190000, actual: 175000 },
    { account: 'Gastos Admin', budgeted: 300000, actual: 240000 },
  ]},
  { id: '4', name: 'Presupuesto Q1 2025', period: 'Ene-Mar 2025', status: 'CLOSED', totalBudgeted: 1800000, totalActual: 1920000, lines: [
    { account: 'Nóminas', budgeted: 800000, actual: 830000 }, { account: 'Servicios', budgeted: 290000, actual: 340000 },
    { account: 'Arrendamiento', budgeted: 240000, actual: 240000 }, { account: 'Impuestos', budgeted: 180000, actual: 210000 },
    { account: 'Gastos Admin', budgeted: 290000, actual: 300000 },
  ]},
];

const statusColors: Record<string, string> = { DRAFT: 'neutral', APPROVED: 'info', ACTIVE: 'success', CLOSED: 'warning' };
const statusLabels: Record<string, string> = { DRAFT: 'Borrador', APPROVED: 'Aprobado', ACTIVE: 'Activo', CLOSED: 'Cerrado' };

export function BudgetsView() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Budget | null>(null);

  useEffect(() => { setTimeout(() => { setBudgets(mockBudgets); setSelected(mockBudgets[0]); setLoading(false); }, 500); }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  const budget = selected || budgets[0];
  const pctUsed = budget.totalBudgeted > 0 ? ((budget.totalActual / budget.totalBudgeted) * 100) : 0;
  const variance = budget.totalBudgeted - budget.totalActual;

  const chartData = budget.lines.map(l => ({ name: l.account, Presupuestado: l.budgeted, Real: l.actual }));

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-playfair font-bold text-vintage-900">Presupuestos</h2><p className="text-sm text-vintage-600 mt-1">Comparación presupuesto vs real</p></div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {budgets.map(b => (
          <button key={b.id} onClick={() => setSelected(b)} className={`px-4 py-2 text-sm rounded-xl whitespace-nowrap transition-all ${selected?.id === b.id ? 'bg-vintage-400 text-white shadow-sm' : 'bg-vintage-100 text-vintage-700 hover:bg-vintage-200'}`}>
            {b.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <VintageCard><p className="text-xs text-vintage-500">Presupuestado</p><p className="text-xl font-bold text-vintage-800">{formatCurrency(budget.totalBudgeted)}</p></VintageCard>
        <VintageCard><p className="text-xs text-vintage-500">Ejecutado</p><p className="text-xl font-bold text-info">{formatCurrency(budget.totalActual)}</p></VintageCard>
        <VintageCard><p className="text-xs text-vintage-500">Variación</p><p className={cn('text-xl font-bold', variance >= 0 ? 'text-success' : 'text-error')}>{formatCurrency(Math.abs(variance))}</p></VintageCard>
        <VintageCard>
          <p className="text-xs text-vintage-500">% Ejecutado</p>
          <div className="flex items-end gap-2">
            <p className="text-xl font-bold text-vintage-800">{pctUsed.toFixed(1)}%</p>
            <div className="flex-1 h-2 bg-vintage-100 rounded-full overflow-hidden"><motion.div className="h-full rounded-full bg-vintage-400" initial={{ width: 0 }} animate={{ width: `${Math.min(pctUsed, 100)}%` }} transition={{ duration: 0.8 }} /></div>
          </div>
          <StatusBadge status={statusColors[budget.status] as any} label={statusLabels[budget.status]} />
        </VintageCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VintageCard>
          <h3 className="text-sm font-semibold text-vintage-800 mb-4">Presupuesto vs Real</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#C9A9A6' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#C9A9A6' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: '#FFF5F7', border: '1px solid #FFE4E8', borderRadius: 12, fontSize: 12 }} formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="Presupuestado" fill="#FFB6C1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Real" fill="#86C1A5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </VintageCard>

        <VintageCard className="p-0 overflow-hidden">
          <div className="px-5 pt-5 pb-3"><h3 className="text-sm font-semibold text-vintage-800">Detalle por Cuenta</h3></div>
          <table className="w-full">
            <thead><tr className="border-b border-vintage-200 bg-vintage-50/50"><th className="px-4 py-2 text-xs font-semibold text-vintage-700 text-left">Cuenta</th><th className="px-4 py-2 text-xs font-semibold text-vintage-700 text-right">Presup.</th><th className="px-4 py-2 text-xs font-semibold text-vintage-700 text-right">Real</th><th className="px-4 py-2 text-xs font-semibold text-vintage-700 text-right">Var.</th></tr></thead>
            <tbody className="divide-y divide-vintage-100">
              {budget.lines.map((l, i) => {
                const v = l.budgeted - l.actual;
                return (
                  <motion.tr key={i} className="hover:bg-vintage-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <td className="px-4 py-2.5 text-sm text-vintage-700">{l.account}</td>
                    <td className="px-4 py-2.5 text-sm text-vintage-600 text-right font-mono">{formatCurrency(l.budgeted)}</td>
                    <td className="px-4 py-2.5 text-sm text-vintage-600 text-right font-mono">{formatCurrency(l.actual)}</td>
                    <td className={cn('px-4 py-2.5 text-sm text-right font-mono', v >= 0 ? 'text-success' : 'text-error')}>{formatCurrency(Math.abs(v))}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </VintageCard>
      </div>
    </div>
  );
}
