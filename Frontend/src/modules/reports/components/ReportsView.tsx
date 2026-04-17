'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  PieChart as PieChartIcon,
  FileSpreadsheet,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Scale,
} from 'lucide-react';
import { useReports } from '../hooks/useReports';
import { usePeriods } from '@/modules/periods/hooks/usePeriods';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { VintageTabs, AnimatedCounter, PageLoader } from '@/components/ui/vintage-ui';
import { AnimatedTable } from '@/components/tables/animated-table';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { exportTrialBalanceExcel, exportBalanceSheetExcel, exportIncomeStatementExcel } from '@/lib/utils/export';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const PIE_COLORS = ['#a8b5a2', '#f0c8c0', '#c4b7d4'];
const INCOME_COLOR = '#a8b5a2';
const EXPENSE_COLOR = '#f0c8c0';

function VintageTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-vintage-200 rounded-xl p-3 shadow-lg">
      <p className="text-sm font-medium text-vintage-800 mb-1">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value, 'MXN')}
        </p>
      ))}
    </div>
  );
}

export function ReportsView() {
  const { periods: dynamicPeriods = [] } = usePeriods();
  const {
    isLoading, period, setPeriod, year, setYear,
    trialBalance = [], balanceSheet = { totalAssets: 0, totalLiabilities: 0, totalEquity: 0, assets: [], liabilities: [], equity: [] }, incomeStatement = { totalIncome: 0, totalExpenses: 0, netIncome: 0, grossProfit: 0, incomeDetails: [], expenseDetails: [] },
    totalDebit = 0, totalCredit = 0,
  } = useReports() as any;

  // Extract unique years from dynamic periods
  const years = Array.from(new Set(dynamicPeriods.map(p => p.year.toString()))).sort().reverse();
  const availablePeriods = dynamicPeriods
    .filter(p => !year || p.year.toString() === year)
    .map(p => `${p.year}-${p.month.toString().padStart(2, '0')}`);

  const [activeTab, setActiveTab] = useState('trial-balance');

  const handleExport = async (format: string) => {
    if (format !== 'excel') {
      toast.info(`La generación de PDFs está en desarrollo. Descargando en Excel.`);
    }
    
    try {
      toast.loading('Generando reporte...');
      if (activeTab === 'trial-balance') {
        await exportTrialBalanceExcel(trialBalance, 'GANESHA Compañía Demo', period, { totalDebit, totalCredit, totalBalance: totalDebit - totalCredit });
      } else if (activeTab === 'balance-sheet') {
        await exportBalanceSheetExcel(balanceSheet.assets || [], balanceSheet.liabilities || [], balanceSheet.equity || [], 'GANESHA Compañía Demo', period);
      } else if (activeTab === 'income-statement') {
        await exportIncomeStatementExcel(incomeStatement.incomeDetails || [], incomeStatement.expenseDetails || [], incomeStatement.netIncome || 0, 'GANESHA Compañía Demo', period);
      }
      toast.dismiss();
      toast.success('Reporte exportado correctamente');
    } catch (e) {
      toast.dismiss();
      toast.error('Error al exportar el reporte');
    }
  };

  if (isLoading) return <PageLoader text="Cargando reportes..." />;

  const tabs = [
    { id: 'trial-balance', label: 'Balanza de Comprobación', icon: <Scale className="w-4 h-4" /> },
    { id: 'balance-sheet', label: 'Balance General', icon: <PieChartIcon className="w-4 h-4" /> },
    { id: 'income-statement', label: 'Estado de Resultados', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  // ── Trial Balance Data ──
  const trialBalanceHeaders = [
    { key: 'code', label: 'Código', align: 'left' as const, className: 'w-[100px]' },
    { key: 'name', label: 'Nombre de la Cuenta', align: 'left' as const },
    { key: 'debit', label: 'Saludores (Debe)', align: 'right' as const, className: 'w-[150px]' },
    { key: 'credit', label: 'Acreedores (Haber)', align: 'right' as const, className: 'w-[150px]' },
    { key: 'net', label: 'Saldo Neto', align: 'right' as const, className: 'w-[150px]' },
  ];

  // ── Balance Sheet Pie Data ──
  const balancePieData = [
    { name: 'Activos', value: balanceSheet.totalAssets, color: PIE_COLORS[0] },
    { name: 'Pasivos', value: balanceSheet.totalLiabilities, color: PIE_COLORS[1] },
    { name: 'Patrimonio', value: balanceSheet.totalEquity, color: PIE_COLORS[2] },
  ];

  // ── Income Statement Bar Data ──
  const incomeBarData = [
    { name: 'Servicios', amount: 1850000, type: 'Ingreso' },
    { name: 'Ventas', amount: 650000, type: 'Ingreso' },
    { name: 'Otros', amount: 85000, type: 'Ingreso' },
    { name: 'Costo Ventas', amount: 620000, type: 'Gasto' },
    { name: 'Nóminas', amount: 540000, type: 'Gasto' },
    { name: 'IMSS', amount: 162000, type: 'Gasto' },
    { name: 'Oficina', amount: 85000, type: 'Gasto' },
    { name: 'Arrendamiento', amount: 180000, type: 'Gasto' },
    { name: 'Depreciación', amount: 140000, type: 'Gasto' },
    { name: 'Serv. Prof.', amount: 120000, type: 'Gasto' },
    { name: 'Servicios', amount: 45000, type: 'Gasto' },
  ];

  const expenseCompareData = [
    { name: 'Ingresos', ingresos: incomeStatement.totalIncome, gastos: 0 },
    { name: 'Gastos', ingresos: 0, gastos: incomeStatement.totalExpenses },
    { name: 'Utilidad', ingresos: incomeStatement.netIncome, gastos: 0 },
  ];



  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Page header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lavender/30 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-vintage-700" />
          </div>
          <div>
            <h1 className="text-2xl font-playfair text-vintage-800">Reportes</h1>
            <p className="text-sm text-vintage-500">Informes financieros y contables</p>
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
        </div>
      </motion.div>

      {/* Period selectors */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-vintage-600 font-medium">Año:</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-3 py-2 text-sm bg-card border border-vintage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-vintage-400"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-vintage-600 font-medium">Periodo:</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 text-sm bg-card border border-vintage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-vintage-400"
          >
            {availablePeriods.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <VintageTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </motion.div>

      {/* Tab content */}
      <motion.div variants={itemVariants}>
        {/* ── TRIAL BALANCE ── */}
        {activeTab === 'trial-balance' && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <VintageCard hover={false} className="p-4">
                <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Total Cuentas</p>
                <p className="text-xl font-playfair text-vintage-800 mt-1">{trialBalance.length}</p>
              </VintageCard>
              <VintageCard hover={false} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-vintage-500" />
                  <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Total Debe</p>
                </div>
                <p className="text-xl font-playfair text-vintage-800 mt-1">{formatCurrency(totalDebit, 'MXN')}</p>
              </VintageCard>
              <VintageCard hover={false} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-vintage-500" />
                  <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Total Haber</p>
                </div>
                <p className="text-xl font-playfair text-vintage-800 mt-1">{formatCurrency(totalCredit, 'MXN')}</p>
              </VintageCard>
            </div>

            {/* Balance indicator */}
            <VintageCard hover={false} className={cn(
              'p-3 flex items-center justify-between',
              Math.abs(totalDebit - totalCredit) <= 0.01 ? 'border-success/50 bg-success/5' : 'border-error/50 bg-error/5',
            )}>
              <span className="text-sm font-medium text-vintage-700">Diferencia Debe - Haber:</span>
              <span className={cn(
                'text-sm font-mono font-bold',
                Math.abs(totalDebit - totalCredit) <= 0.01 ? 'text-success' : 'text-error',
              )}>
                {formatCurrency(Math.abs(totalDebit - totalCredit), 'MXN')}
                {Math.abs(totalDebit - totalCredit) <= 0.01 ? ' ✓ Cuadrada' : ''}
              </span>
            </VintageCard>

            {/* Table */}
            <AnimatedTable
              headers={trialBalanceHeaders}
              data={trialBalance}
              keyExtractor={(row) => row.accountId}
              renderRow={(row, idx) => (
                <>
                  <td className="px-4 py-2.5 text-sm font-mono text-vintage-600">{row.accountCode}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'w-2 h-2 rounded-full',
                        row.accountType === 'ASSET' && 'bg-info',
                        row.accountType === 'LIABILITY' && 'bg-peach',
                        row.accountType === 'EQUITY' && 'bg-lavender',
                        row.accountType === 'INCOME' && 'bg-success',
                        row.accountType === 'EXPENSE' && 'bg-error/70',
                      )} />
                      <span className="text-sm text-vintage-700">{row.accountName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm font-mono text-vintage-700">
                    {row.debitBalance > 0 ? formatCurrency(row.debitBalance, 'MXN') : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-sm font-mono text-vintage-700">
                    {row.creditBalance > 0 ? formatCurrency(row.creditBalance, 'MXN') : '—'}
                  </td>
                  <td className={cn(
                    'px-4 py-2.5 text-right text-sm font-mono font-semibold',
                    row.netBalance > 0 ? 'text-success' : row.netBalance < 0 ? 'text-error' : 'text-vintage-500',
                  )}>
                    {formatCurrency(row.netBalance, 'MXN')}
                  </td>
                </>
              )}
              emptyMessage="No hay datos para este periodo"
            />
          </div>
        )}

        {/* ── BALANCE SHEET ── */}
        {activeTab === 'balance-sheet' && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <VintageCard hover={false} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-success" />
                  <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Total Activos</p>
                </div>
                <AnimatedCounter value={balanceSheet.totalAssets} prefix="$" decimals={0} className="text-xl font-playfair text-success" />
              </VintageCard>
              <VintageCard hover={false} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-error" />
                  <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Total Pasivos</p>
                </div>
                <AnimatedCounter value={balanceSheet.totalLiabilities} prefix="$" decimals={0} className="text-xl font-playfair text-error" />
              </VintageCard>
              <VintageCard hover={false} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-vintage-700" />
                  <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Total Patrimonio</p>
                </div>
                <AnimatedCounter value={balanceSheet.totalEquity} prefix="$" decimals={0} className="text-xl font-playfair text-vintage-800" />
              </VintageCard>
            </div>

            {/* Pie chart and breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie chart */}
              <VintageCard hover={false} className="p-5">
                <h3 className="text-lg font-playfair text-vintage-800 mb-4">Composición Financiera</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={balancePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {balancePieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<VintageTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        formatter={(value: string) => <span className="text-sm text-vintage-700">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </VintageCard>

              {/* Breakdown */}
              <div className="space-y-4">
                {/* Assets breakdown */}
                <VintageCard hover={false} className="p-4">
                  <h4 className="text-sm font-semibold text-vintage-800 mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-success" />
                    Activos ({formatCurrency(balanceSheet.totalAssets, 'MXN')})
                  </h4>
                  <div className="space-y-2">
                    {(balanceSheet.assets || []).map((section: any) => (
                      <div key={section.name}>
                        <p className="text-sm font-medium text-vintage-700">{section.name}: {formatCurrency(section.amount, 'MXN')}</p>
                        {section.subItems?.map((sub) => (
                          <p key={sub.name} className="text-xs text-vintage-500 pl-4">
                            {sub.name}: {formatCurrency(sub.amount, 'MXN')}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </VintageCard>

                {/* Liabilities breakdown */}
                <VintageCard hover={false} className="p-4">
                  <h4 className="text-sm font-semibold text-vintage-800 mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-error" />
                    Pasivos ({formatCurrency(balanceSheet.totalLiabilities, 'MXN')})
                  </h4>
                  <div className="space-y-2">
                    {(balanceSheet.liabilities || []).map((section: any) => (
                      <div key={section.name}>
                        <p className="text-sm font-medium text-vintage-700">{section.name}: {formatCurrency(section.amount, 'MXN')}</p>
                        {section.subItems?.map((sub) => (
                          <p key={sub.name} className="text-xs text-vintage-500 pl-4">
                            {sub.name}: {formatCurrency(sub.amount, 'MXN')}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </VintageCard>

                {/* Equity breakdown */}
                <VintageCard hover={false} className="p-4">
                  <h4 className="text-sm font-semibold text-vintage-800 mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-lavender" />
                    Patrimonio ({formatCurrency(balanceSheet.totalEquity, 'MXN')})
                  </h4>
                  <div className="space-y-2">
                    {(balanceSheet.equity || []).map((section: any) => (
                      <div key={section.name}>
                        <p className="text-sm font-medium text-vintage-700">{section.name}: {formatCurrency(section.amount, 'MXN')}</p>
                        {section.subItems?.map((sub) => (
                          <p key={sub.name} className="text-xs text-vintage-500 pl-4">
                            {sub.name}: {formatCurrency(sub.amount, 'MXN')}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </VintageCard>
              </div>
            </div>
          </div>
        )}

        {/* ── INCOME STATEMENT ── */}
        {activeTab === 'income-statement' && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <VintageCard hover={false} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Total Ingresos</p>
                </div>
                <AnimatedCounter value={incomeStatement.totalIncome} prefix="$" decimals={0} className="text-xl font-playfair text-success" />
              </VintageCard>
              <VintageCard hover={false} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-error" />
                  <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Total Gastos</p>
                </div>
                <AnimatedCounter value={incomeStatement.totalExpenses} prefix="$" decimals={0} className="text-xl font-playfair text-error" />
              </VintageCard>
              <VintageCard hover={false} className="p-4">
                <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Utilidad Bruta</p>
                <AnimatedCounter value={incomeStatement.grossProfit} prefix="$" decimals={0} className="text-xl font-playfair text-vintage-800" />
              </VintageCard>
              <VintageCard hover={false} variant="gradient" className="p-4">
                <p className="text-xs text-vintage-500 font-medium uppercase tracking-wider">Utilidad Neta</p>
                <AnimatedCounter value={incomeStatement.netIncome} prefix="$" decimals={0} className="text-2xl font-playfair text-success font-bold" />
                <p className="text-xs text-success mt-1">
                  Margen: {((incomeStatement.netIncome / incomeStatement.totalIncome) * 100).toFixed(1)}%
                </p>
              </VintageCard>
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Income vs Expenses overview */}
              <VintageCard hover={false} className="p-5">
                <h3 className="text-lg font-playfair text-vintage-800 mb-4">Ingresos vs Gastos</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expenseCompareData} barSize={50}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d8" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#7a6f65' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#7a6f65' }} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                      <Tooltip content={<VintageTooltip />} />
                      <Legend />
                      <Bar dataKey="ingresos" fill={INCOME_COLOR} name="Ingresos" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="gastos" fill={EXPENSE_COLOR} name="Gastos" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </VintageCard>

              {/* Detailed expense breakdown */}
              <VintageCard hover={false} className="p-5">
                <h3 className="text-lg font-playfair text-vintage-800 mb-4">Desglose de Gastos</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incomeBarData.filter((d) => d.type === 'Gasto')} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d8" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#7a6f65' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#7a6f65' }} width={90} />
                      <Tooltip content={<VintageTooltip />} />
                      <Bar dataKey="amount" fill={EXPENSE_COLOR} name="Monto" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </VintageCard>
            </div>

            {/* Detailed tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Income details */}
              <VintageCard hover={false} className="overflow-hidden">
                <div className="p-4 border-b border-vintage-100">
                  <h3 className="text-sm font-semibold text-vintage-800">Desglose de Ingresos</h3>
                </div>
                <div className="p-4 space-y-3">
                  {(incomeStatement.incomeDetails || []).map((item: any) => {
                    const pct = (item.amount / incomeStatement.totalIncome) * 100;
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-vintage-700">{item.name}</span>
                          <span className="text-sm font-mono font-semibold text-success">{formatCurrency(item.amount, 'MXN')}</span>
                        </div>
                        <div className="h-1.5 bg-vintage-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-success rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="border-t border-vintage-200 pt-2 flex justify-between">
                    <span className="text-sm font-bold text-vintage-800">Total Ingresos</span>
                    <span className="text-sm font-mono font-bold text-success">{formatCurrency(incomeStatement.totalIncome, 'MXN')}</span>
                  </div>
                </div>
              </VintageCard>

              {/* Expense details */}
              <VintageCard hover={false} className="overflow-hidden">
                <div className="p-4 border-b border-vintage-100">
                  <h3 className="text-sm font-semibold text-vintage-800">Desglose de Gastos</h3>
                </div>
                <div className="p-4 space-y-3">
                  {(incomeStatement.expenseDetails || []).map((item: any) => {
                    const pct = (item.amount / incomeStatement.totalExpenses) * 100;
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-vintage-700">{item.name}</span>
                          <span className="text-sm font-mono font-semibold text-error">{formatCurrency(item.amount, 'MXN')}</span>
                        </div>
                        <div className="h-1.5 bg-vintage-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-error rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="border-t border-vintage-200 pt-2 flex justify-between">
                    <span className="text-sm font-bold text-vintage-800">Total Gastos</span>
                    <span className="text-sm font-mono font-bold text-error">{formatCurrency(incomeStatement.totalExpenses, 'MXN')}</span>
                  </div>
                </div>
              </VintageCard>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
