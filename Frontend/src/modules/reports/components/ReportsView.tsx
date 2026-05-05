'use client';

import { useState, useEffect } from 'react';
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
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  exportTrialBalanceExcel, exportTrialBalancePDF,
  exportBalanceSheetExcel, exportBalanceSheetPDF,
  exportIncomeStatementExcel, exportIncomeStatementPDF,
  exportCashFlowExcel, exportCashFlowPDF,
  exportGeneralLedgerExcel, exportGeneralLedgerPDF
} from '@/lib/utils/export';
import { useAppStore } from '@/lib/stores/useAppStore';
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
    <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-vintage-200 dark:border-zinc-800 rounded-xl p-3 shadow-lg text-vintage-800 dark:text-zinc-100">
      <p className="text-sm font-medium mb-1">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value, 'NIO')}
        </p>
      ))}
    </div>
  );
}

function BalanceSection({ title, color, total, items }: any) {
  return (
    <VintageCard hover={false} className="p-4">
      <h4 className="text-sm font-semibold text-vintage-800 dark:text-zinc-100 mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("w-3 h-3 rounded-full", color)} />
          {title}
        </div>
        <span className="text-base font-playfair">{formatCurrency(total, 'NIO')}</span>
      </h4>
      <div className="space-y-1">
        {(items || []).map((item: any, idx: number) => (
          <div 
            key={`${item.accountId}-${idx}`} 
            className={cn(
              "flex justify-between items-center py-1 group transition-colors hover:bg-vintage-50/50 dark:hover:bg-zinc-800/30 px-2 rounded-lg",
              item.isGroup ? "font-bold text-vintage-900 dark:text-zinc-100" : "text-vintage-600 dark:text-zinc-400 text-sm"
            )}
            style={{ paddingLeft: `${(item.level - 1) * 16 + 8}px` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono opacity-50">{item.accountCode}</span>
              <span>{item.accountName}</span>
            </div>
            <span className="font-mono">{formatCurrency(item.balance, 'NIO')}</span>
          </div>
        ))}
      </div>
    </VintageCard>
  );
}
function IncomeSection({ title, color, total, items }: any) {
  return (
    <VintageCard hover={false} className="p-4">
      <h4 className="text-sm font-semibold text-vintage-800 dark:text-zinc-100 mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("w-3 h-3 rounded-full", color)} />
          {title}
        </div>
        <span className="text-base font-playfair">{formatCurrency(total, 'NIO')}</span>
      </h4>
      <div className="space-y-1">
        {(items || []).map((item: any, idx: number) => (
          <div 
            key={`${item.accountId}-${idx}`} 
            className={cn(
              "flex justify-between items-center py-1 group transition-colors hover:bg-vintage-50/50 dark:hover:bg-zinc-800/30 px-2 rounded-lg",
              item.isGroup ? "font-bold text-vintage-900 dark:text-zinc-100" : "text-vintage-600 dark:text-zinc-400 text-sm"
            )}
            style={{ paddingLeft: `${(item.level - 1) * 16 + 8}px` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono opacity-50">{item.accountCode}</span>
              <span>{item.accountName}</span>
            </div>
            <span className="font-mono">{formatCurrency(item.balance, 'NIO')}</span>
          </div>
        ))}
      </div>
    </VintageCard>
  );
}

export function ReportsView() {
  const { periods: dynamicPeriods = [] } = usePeriods();
  const currentCompany = useAppStore(s => s.currentCompany);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [period, setPeriod] = useState(`${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`);

  const [activeTab, setActiveTab] = useState('trial-balance');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const {
    isLoading = false,
    trialBalance: trialBalanceData = null,
    balanceSheet: balanceSheetData = null,
    incomeStatement: incomeStatementData = null,
    cashFlow: cashFlowData = null,
    generalLedger: generalLedgerData = null,
  } = (useReports(year, period.split('-')[1], selectedAccountId) || {}) as any;

  // Auto-select latest period if empty
  useEffect(() => {
    if (dynamicPeriods && dynamicPeriods.length > 0 && !dynamicPeriods.some(p => `${p.year}-${p.month.toString().padStart(2, '0')}` === period)) {
      const latest = dynamicPeriods[dynamicPeriods.length - 1];
      if (latest) {
        setYear(latest.year.toString());
        setPeriod(`${latest.year}-${latest.month.toString().padStart(2, '0')}`);
      }
    }
  }, [dynamicPeriods, period]);

  // Si no hay datos todavía, evitamos cálculos pesados
  const safeTrialBalanceData = trialBalanceData || { accounts: [], totals: { totalDebit: 0, totalCredit: 0 } };
  const safeBalanceSheetData = balanceSheetData || { totalAssets: 0, totalLiabilities: 0, totalEquity: 0, assets: [], liabilities: [], equity: [] };
  const safeIncomeStatementData = incomeStatementData || { totalIncome: 0, totalExpenses: 0, netIncome: 0, income: [], expenses: [] };

  const trialBalance = safeTrialBalanceData.accounts || [];
  const totals = safeTrialBalanceData.totals || { totalDebit: 0, totalCredit: 0 };
  const totalDebit = totals.totalDebit;
  const totalCredit = totals.totalCredit;

  // Extract unique years from dynamic periods
  const years: string[] = (dynamicPeriods || []).map((p: any) => p.year.toString()).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i).sort().reverse();
  const availablePeriods: string[] = (dynamicPeriods || [])
    .filter(p => !year || p.year.toString() === year)
    .map(p => `${p.year}-${p.month.toString().padStart(2, '0')}`);

  const balanceSheet = safeBalanceSheetData || { 
    totalAssets: 0, 
    totalLiabilities: 0, 
    totalEquity: 0, 
    assets: [], 
    liabilities: [], 
    equity: [] 
  };
  
  const incomeStatement = safeIncomeStatementData || { 
    totalIncome: 0, 
    totalExpenses: 0, 
    netIncome: 0, 
    income: [], 
    expenses: [] 
  };

  const handleExport = async (format: string) => {
    toast.loading('Generando reporte...', { id: 'export-loading' });
    try {
      const companyName = currentCompany?.name || 'GANESHA Compañía';
      
      if (activeTab === 'trial-balance') {
        if (format === 'excel') {
          await exportTrialBalanceExcel(trialBalance, companyName, period, { totalDebit, totalCredit, totalBalance: totalDebit - totalCredit });
        } else {
          await exportTrialBalancePDF(trialBalance, companyName, period, { totalDebit, totalCredit, totalBalance: totalDebit - totalCredit });
        }
      } else if (activeTab === 'balance-sheet') {
        if (format === 'excel') {
          await exportBalanceSheetExcel(balanceSheet.assets || [], balanceSheet.liabilities || [], balanceSheet.equity || [], companyName, period);
        } else {
          await exportBalanceSheetPDF(balanceSheet.assets || [], balanceSheet.liabilities || [], balanceSheet.equity || [], companyName, period);
        }
      } else if (activeTab === 'income-statement') {
        if (format === 'excel') {
          await exportIncomeStatementExcel(incomeStatement.income || [], incomeStatement.expenses || [], incomeStatement.netIncome || 0, companyName, period);
        } else {
          await exportIncomeStatementPDF(incomeStatement.income || [], incomeStatement.expenses || [], incomeStatement.netIncome || 0, companyName, period);
        }
      } else if (activeTab === 'cash-flow') {
        if (format === 'excel') {
          await exportCashFlowExcel(cashFlowData, companyName, period);
        } else {
          await exportCashFlowPDF(cashFlowData, companyName, period);
        }
      } else if (activeTab === 'general-ledger') {
        const selectedAcc = trialBalance.find((a: any) => a.accountId === selectedAccountId);
        if (!selectedAcc || !generalLedgerData) {
          toast.error('Selecciona una cuenta con movimientos', { id: 'export-loading' });
          return;
        }
        if (format === 'excel') {
          await exportGeneralLedgerExcel(selectedAcc, generalLedgerData.movements || [], companyName, period);
        } else {
          await exportGeneralLedgerPDF(selectedAcc, generalLedgerData.movements || [], companyName, period);
        }
      }
      
      toast.success(`Reporte ${format.toUpperCase()} exportado correctamente`, { id: 'export-loading' });
    } catch (e) {
      toast.error('Error al exportar el reporte', { id: 'export-loading' });
    }
  };

  if (isLoading) return <PageLoader text="Cargando reportes..." />;

  const tabs = [
    { id: 'trial-balance', label: 'Balanza de Comprobación', icon: <Scale className="w-4 h-4" /> },
    { id: 'balance-sheet', label: 'Balance General', icon: <PieChartIcon className="w-4 h-4" /> },
    { id: 'income-statement', label: 'Estado de Resultados', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'cash-flow', label: 'Flujo de Efectivo', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'general-ledger', label: 'Libro Mayor', icon: <FileSpreadsheet className="w-4 h-4" /> },
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


  const expenseCompareData = [
    { name: 'Ingresos', ingresos: incomeStatement.totalIncome, gastos: 0 },
    { name: 'Gastos', ingresos: 0, gastos: incomeStatement.totalExpenses },
    { name: 'Utilidad', ingresos: incomeStatement.netIncome, gastos: 0 },
  ];

  return (
    <motion.div 
      className="min-h-screen bg-background"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="space-y-6">
        {/* Page header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lavender/30 dark:bg-indigo-950/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-vintage-700 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-playfair text-vintage-800 dark:text-zinc-100">Reportes</h1>
              <p className="text-sm text-vintage-500 dark:text-zinc-500">Informes financieros y contables</p>
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
            <label className="text-sm text-vintage-600 dark:text-zinc-500 font-medium">Año:</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-3 py-2 text-sm bg-card dark:bg-zinc-900 border border-vintage-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-vintage-400 dark:focus:ring-zinc-700 text-vintage-800 dark:text-zinc-300"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-vintage-600 dark:text-zinc-500 font-medium">Periodo:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 text-sm bg-card dark:bg-zinc-900 border border-vintage-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-vintage-400 dark:focus:ring-zinc-700 text-vintage-800 dark:text-zinc-300"
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
                  <p className="text-xs text-vintage-500 dark:text-zinc-500 font-medium uppercase tracking-wider">Total Cuentas</p>
                  <p className="text-xl font-playfair text-vintage-800 dark:text-zinc-100 mt-1">{trialBalance.length}</p>
                </VintageCard>
                <VintageCard hover={false} className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-vintage-500 dark:text-zinc-500" />
                    <p className="text-xs text-vintage-500 dark:text-zinc-500 font-medium uppercase tracking-wider">Total Debe</p>
                  </div>
                  <p className="text-xl font-playfair text-vintage-800 dark:text-zinc-100 mt-1">{formatCurrency(totalDebit, 'NIO')}</p>
                </VintageCard>
                <VintageCard hover={false} className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="w-4 h-4 text-vintage-500 dark:text-zinc-500" />
                    <p className="text-xs text-vintage-500 dark:text-zinc-500 font-medium uppercase tracking-wider">Total Haber</p>
                  </div>
                  <p className="text-xl font-playfair text-vintage-800 dark:text-zinc-100 mt-1">{formatCurrency(totalCredit, 'NIO')}</p>
                </VintageCard>
              </div>

              {/* Balance indicator */}
              <VintageCard hover={false} className={cn(
                'p-3 flex items-center justify-between',
                Math.abs(totalDebit - totalCredit) <= 0.01 
                  ? 'border-success/50 bg-success/5 dark:bg-emerald-950/10' 
                  : 'border-error/50 bg-error/5 dark:bg-red-950/10',
              )}>
                <span className="text-sm font-medium text-vintage-700 dark:text-zinc-400">Diferencia Debe - Haber:</span>
                <span className={cn(
                  'text-sm font-mono font-bold',
                  Math.abs(totalDebit - totalCredit) <= 0.01 ? 'text-success' : 'text-error',
                )}>
                  {formatCurrency(Math.abs(totalDebit - totalCredit), 'NIO')}
                  {Math.abs(totalDebit - totalCredit) <= 0.01 ? ' ✓ Cuadrada' : ''}
                </span>
              </VintageCard>

              {/* Table */}
              <AnimatedTable
                headers={trialBalanceHeaders}
                data={trialBalance}
                keyExtractor={(row: any) => row.accountId}
                renderRow={(row: any) => (
                  <>
                    <td className="px-4 py-2.5 text-sm font-mono text-vintage-600 dark:text-zinc-400">
                      <div style={{ paddingLeft: `${(row.level - 1) * 12}px` }}>
                        {row.accountCode}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2" style={{ paddingLeft: `${(row.level - 1) * 12}px` }}>
                        <span className={cn(
                          'w-2 h-2 rounded-full',
                          row.accountType === 'ASSET' && 'bg-info',
                          row.accountType === 'LIABILITY' && 'bg-peach',
                          row.accountType === 'EQUITY' && 'bg-lavender',
                          row.accountType === 'INCOME' && 'bg-success',
                          row.accountType === 'EXPENSE' && 'bg-error/70',
                        )} />
                        <span className={cn(
                          "text-sm",
                          row.isGroup ? "font-bold text-vintage-800 dark:text-zinc-100" : "text-vintage-700 dark:text-zinc-300"
                        )}>{row.accountName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-mono text-vintage-700 dark:text-zinc-400">
                      {row.totalDebit > 0 || row.isGroup ? formatCurrency(row.totalDebit, 'NIO') : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-mono text-vintage-700 dark:text-zinc-400">
                      {row.totalCredit > 0 || row.isGroup ? formatCurrency(row.totalCredit, 'NIO') : '—'}
                    </td>
                    <td className={cn(
                      'px-4 py-2.5 text-right text-sm font-mono font-semibold',
                      row.balance > 0 ? 'text-success dark:text-emerald-400' : row.balance < 0 ? 'text-error dark:text-red-400' : 'text-vintage-500 dark:text-zinc-600',
                    )}>
                      {formatCurrency(row.balance, 'NIO')}
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
                    <DollarSign className="w-4 h-4 text-success dark:text-emerald-400" />
                    <p className="text-xs text-vintage-500 dark:text-zinc-500 font-medium uppercase tracking-wider">Total Activos</p>
                  </div>
                  <AnimatedCounter value={balanceSheet.totalAssets} prefix="$" decimals={0} className="text-xl font-playfair text-success dark:text-emerald-400" />
                </VintageCard>
                <VintageCard hover={false} className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-error dark:text-red-400" />
                    <p className="text-xs text-vintage-500 dark:text-zinc-500 font-medium uppercase tracking-wider">Total Pasivos</p>
                  </div>
                  <AnimatedCounter value={balanceSheet.totalLiabilities} prefix="$" decimals={0} className="text-xl font-playfair text-error dark:text-red-400" />
                </VintageCard>
                <VintageCard hover={false} className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-vintage-700 dark:text-zinc-400" />
                    <p className="text-xs text-vintage-500 dark:text-zinc-500 font-medium uppercase tracking-wider">Total Patrimonio</p>
                  </div>
                  <AnimatedCounter value={balanceSheet.totalEquity} prefix="$" decimals={0} className="text-xl font-playfair text-vintage-800 dark:text-zinc-100" />
                </VintageCard>
              </div>

              {/* Pie chart and breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie chart */}
                <VintageCard hover={false} className="p-5">
                  <h3 className="text-lg font-playfair text-vintage-800 dark:text-zinc-100 mb-4">Composición Financiera</h3>
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
                          formatter={(value: string) => <span className="text-sm text-vintage-700 dark:text-zinc-400">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </VintageCard>

                {/* Breakdown */}
                <div className="space-y-4">
                  <BalanceSection 
                    title="Activos" 
                    color="bg-success" 
                    total={balanceSheet.totalAssets} 
                    items={balanceSheet.assets} 
                  />
                  <BalanceSection 
                    title="Pasivos" 
                    color="bg-error" 
                    total={balanceSheet.totalLiabilities} 
                    items={balanceSheet.liabilities} 
                  />
                  <BalanceSection 
                    title="Patrimonio" 
                    color="bg-lavender" 
                    total={balanceSheet.totalEquity} 
                    items={balanceSheet.equity} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── INCOME STATEMENT ── */}
          {activeTab === 'income-statement' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <VintageCard hover={false} className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-success dark:text-emerald-400" />
                    <p className="text-xs text-vintage-500 dark:text-zinc-500 font-medium uppercase tracking-wider">Total Ingresos</p>
                  </div>
                  <AnimatedCounter value={incomeStatement.totalIncome} prefix="C$" decimals={0} className="text-xl font-playfair text-success dark:text-emerald-400" />
                </VintageCard>
                <VintageCard hover={false} className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="w-4 h-4 text-error dark:text-red-400" />
                    <p className="text-xs text-vintage-500 dark:text-zinc-500 font-medium uppercase tracking-wider">Total Gastos</p>
                  </div>
                  <AnimatedCounter value={incomeStatement.totalExpenses} prefix="C$" decimals={0} className="text-xl font-playfair text-error dark:text-red-400" />
                </VintageCard>
                <VintageCard hover={false} className="p-4">
                  <p className="text-xs text-vintage-500 dark:text-zinc-500 font-medium uppercase tracking-wider">Utilidad Neta</p>
                  <AnimatedCounter value={incomeStatement.netIncome} prefix="C$" decimals={0} className="text-xl font-playfair text-vintage-800 dark:text-zinc-100" />
                </VintageCard>
                <VintageCard hover={false} variant="gradient" className="p-4">
                  <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Margen Operativo</p>
                  <p className="text-2xl font-playfair text-white font-bold">
                    {incomeStatement.totalIncome > 0 ? ((incomeStatement.netIncome / incomeStatement.totalIncome) * 100).toFixed(1) : 0}%
                  </p>
                </VintageCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <IncomeSection title="Ingresos" color="bg-success" total={incomeStatement.totalIncome} items={incomeStatement.income} />
                <IncomeSection title="Gastos" color="bg-error" total={incomeStatement.totalExpenses} items={incomeStatement.expenses} />
              </div>
            </div>
          )}

          {/* ── CASH FLOW ── */}
          {activeTab === 'cash-flow' && cashFlowData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <VintageCard hover={false} className="p-6">
                  <p className="text-sm text-vintage-500 font-medium mb-1 uppercase tracking-wider">Utilidad Neta</p>
                  <p className="text-3xl font-playfair text-vintage-800 dark:text-zinc-100">{formatCurrency(cashFlowData.netIncome, 'NIO')}</p>
                </VintageCard>
                <VintageCard hover={false} className="p-6">
                  <p className="text-sm text-vintage-500 font-medium mb-1 uppercase tracking-wider">Actividades Operativas</p>
                  <p className="text-3xl font-playfair text-vintage-800 dark:text-zinc-100">{formatCurrency(cashFlowData.operatingActivities, 'NIO')}</p>
                </VintageCard>
                <VintageCard hover={false} variant="gradient" className="p-6">
                  <p className="text-sm text-white/70 font-medium mb-1 uppercase tracking-wider">Cambio Neto en Efectivo</p>
                  <p className="text-3xl font-playfair text-white font-bold">{formatCurrency(cashFlowData.netChange, 'NIO')}</p>
                </VintageCard>
              </div>

              <VintageCard hover={false} className="p-8 flex flex-col items-center justify-center text-center bg-vintage-50/50 dark:bg-zinc-900/30">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                  <TrendingUp className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl font-playfair text-vintage-800 dark:text-zinc-100 mb-2">Análisis de Flujo de Efectivo</h3>
                <p className="text-vintage-600 dark:text-zinc-400 max-w-md">
                  Este reporte resume las fuentes y usos de efectivo durante el periodo seleccionado, permitiendo entender la liquidez real de la empresa.
                </p>
              </VintageCard>
            </div>
          )}

          {/* ── GENERAL LEDGER ── */}
          {activeTab === 'general-ledger' && (
            <div className="space-y-6">
              <VintageCard hover={false} className="p-4 flex flex-col sm:flex-row items-center gap-4 bg-vintage-50/30 dark:bg-zinc-900/30 border-dashed">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-vintage-600 dark:text-zinc-500 mb-1.5 ml-1 uppercase">Seleccionar Cuenta:</label>
                  <select 
                    value={selectedAccountId} 
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-vintage-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400"
                  >
                    <option value="">— Seleccione una cuenta —</option>
                    {trialBalance.filter((a: any) => !a.isGroup).map((acc: any) => (
                      <option key={acc.accountId} value={acc.accountId}>
                        {acc.accountCode} - {acc.accountName}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedAccountId && generalLedgerData && (
                  <div className="flex gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-vintage-500 uppercase">Saldo Inicial</p>
                      <p className="text-sm font-mono font-bold dark:text-zinc-300">{formatCurrency(generalLedgerData.initialBalance || 0, 'NIO')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-vintage-500 uppercase">Saldo Final</p>
                      <p className="text-sm font-mono font-bold text-success dark:text-emerald-400">{formatCurrency(generalLedgerData.finalBalance || 0, 'NIO')}</p>
                    </div>
                  </div>
                )}
              </VintageCard>

              {selectedAccountId ? (
                generalLedgerData && generalLedgerData.movements?.length > 0 ? (
                  <AnimatedTable
                    headers={[
                      { key: 'date', label: 'Fecha', align: 'left' },
                      { key: 'type', label: 'Tipo', align: 'center' },
                      { key: 'desc', label: 'Descripción', align: 'left' },
                      { key: 'debit', label: 'Debe', align: 'right' },
                      { key: 'credit', label: 'Haber', align: 'right' },
                      { key: 'balance', label: 'Saldo', align: 'right' },
                    ]}
                    data={generalLedgerData.movements}
                    keyExtractor={(row: any) => `${row.date}-${row.description}-${row.debit}`}
                    renderRow={(row: any) => (
                      <>
                        <td className="px-4 py-2 text-sm text-vintage-600 dark:text-zinc-500">{formatDate(row.date)}</td>
                        <td className="px-4 py-2 text-center text-xs font-bold text-vintage-500 dark:text-zinc-500">{row.entryType}</td>
                        <td className="px-4 py-2 text-sm text-vintage-700 dark:text-zinc-300">{row.description}</td>
                        <td className="px-4 py-2 text-right text-sm font-mono text-vintage-600 dark:text-zinc-400">{formatCurrency(row.debit, 'NIO')}</td>
                        <td className="px-4 py-2 text-right text-sm font-mono text-vintage-600 dark:text-zinc-400">{formatCurrency(row.credit, 'NIO')}</td>
                        <td className="px-4 py-2 text-right text-sm font-mono font-bold text-vintage-800 dark:text-zinc-100">{formatCurrency(row.runningBalance, 'NIO')}</td>
                      </>
                    )}
                  />
                ) : (
                  <div className="py-20 text-center text-vintage-500 italic">No hay movimientos registrados para esta cuenta en el periodo.</div>
                )
              ) : (
                <div className="py-20 text-center text-vintage-500">Por favor, seleccione una cuenta para visualizar el Libro Mayor.</div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
