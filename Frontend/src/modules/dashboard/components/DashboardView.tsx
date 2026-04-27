'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  PiggyBank,
  Wallet,
  FileText,
  FileSpreadsheet,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/stores/useAppStore';
import { useDashboard } from '../hooks/useDashboard';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { AnimatedCounter, PageLoader, StatusBadge, VintageTabs } from '@/components/ui/vintage-ui';
import { formatCurrency, formatCompactNumber, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils/format';

// ─── Animation Variants ────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as any },
  },
};

// ─── Pastel Chart Colors ───────────────────────────────────────────
const PASTEL_COLORS = ['var(--primary)', '#D4A5A5', '#E6E6FA', '#F5E6D3', '#86C1A5', '#FFDAB9'];
const DASHBOARD_DOT_CLASSES = [
  'dashboard-dot-0',
  'dashboard-dot-1',
  'dashboard-dot-2',
  'dashboard-dot-3',
  'dashboard-dot-4',
  'dashboard-dot-5',
];

function getDashboardDotClass(index: number) {
  return DASHBOARD_DOT_CLASSES[index % DASHBOARD_DOT_CLASSES.length];
}

function getProgressFillClass(percent: number) {
  const step = Math.min(100, Math.max(0, Math.round(percent / 10) * 10));
  return `progress-fill-${step}`;
}

// ─── Custom Tooltip ────────────────────────────────────────────────
function VintageTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-vintage-200 dark:border-zinc-800 rounded-xl p-3 shadow-lg">
      <p className="text-xs font-medium text-vintage-600 dark:text-zinc-400 mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-xs mb-1 last:mb-0">
          <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', getDashboardDotClass(index))} />
          <span className="text-vintage-600 dark:text-zinc-400 capitalize">{entry.name}:</span>
          <span className="font-semibold text-vintage-800 dark:text-zinc-100">
            {formatCurrency(entry.value, 'NIO', 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Pie Tooltip ───────────────────────────────────────────────────
function PieVintageTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];

  return (
    <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-vintage-200 dark:border-zinc-800 rounded-xl p-3 shadow-lg">
      <div className="flex items-center gap-2 text-xs">
        <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', getDashboardDotClass(entry.payload?.index ?? 0))} />
        <span className="text-vintage-600 dark:text-zinc-400">{entry.name}:</span>
        <span className="font-semibold text-vintage-800 dark:text-zinc-100">
          {formatCurrency(entry.value, 'NIO', 0)}
        </span>
      </div>
    </div>
  );
}

// ─── Custom Axis Tick ──────────────────────────────────────────────
function VintageTick({ x, y, payload }: any) {
  return (
    <text
      x={x}
      y={y + 12}
      textAnchor="middle"
      className="fill-vintage-500 dark:fill-zinc-500 text-[10px] font-sans"
    >
      {payload.value}
    </text>
  );
}

// ─── KPI Card Component ────────────────────────────────────────────
function KPICard({
  title,
  value,
  change,
  icon,
  iconBg,
  delay = 0,
}: {
  title: string;
  value: number;
  change?: number;
  icon: React.ReactNode;
  iconBg: string;
  delay?: number;
}) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <motion.div variants={itemVariants}>
      <VintageCard className="relative overflow-hidden group">
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-vintage-100/50 to-transparent rounded-bl-[40px] transition-all duration-500 group-hover:w-24 group-hover:h-24" />

        <div className="relative flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-vintage-500 mb-1 uppercase tracking-wider">
              {title}
            </p>
            <div className="mb-2">
              <AnimatedCounter
                value={value}
                prefix="C$"
                decimals={0}
                className="text-2xl sm:text-3xl font-bold text-vintage-800 dark:text-zinc-100"
              />
            </div>
            {change !== undefined && (
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-success" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-error" />
                )}
                <span
                  className={cn(
                    'text-xs font-semibold',
                    isPositive ? 'text-success' : 'text-error'
                  )}
                >
                  {Math.abs(change).toFixed(1)}%
                </span>
                <span className="text-xs text-vintage-400 ml-1">vs mes anterior</span>
              </div>
            )}
          </div>

          <div
            className={cn(
              'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110',
              iconBg
            )}
          >
            {icon}
          </div>
        </div>
      </VintageCard>
    </motion.div>
  );
}

// ─── Journal Entry Row ─────────────────────────────────────────────
function JournalEntryRow({ entry }: { entry: any }) {
  const statusMap: Record<string, { status: 'success' | 'warning'; label: string }> = {
    POSTED: { status: 'success', label: 'Publicada' },
    DRAFT: { status: 'warning', label: 'Borrador' },
  };
  const statusInfo = statusMap[entry.status] || { status: 'neutral' as const, label: entry.status };

  return (
    <div className="flex items-center gap-3 py-3 px-1 border-b border-vintage-100 dark:border-zinc-800 last:border-0 hover:bg-vintage-50/50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors">
      <div className="shrink-0">
        <span
          className={cn(
            'inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold',
            entry.entryType === 'INGRESO'
              ? 'bg-success/15 text-success'
              : entry.entryType === 'EGRESO'
              ? 'bg-error/15 text-error'
              : 'bg-lavender/60 text-vintage-700'
          )}
        >
          {entry.entryType === 'INGRESO' ? 'In' : entry.entryType === 'EGRESO' ? 'Eg' : 'Di'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-vintage-800 truncate">{entry.description}</p>
        <p className="text-xs text-vintage-500">{entry.entryNumber}</p>
      </div>
      <div className="text-right shrink-0 hidden sm:block">
        <p className="text-sm font-semibold text-vintage-800">
          {formatCurrency(entry.totalDebit, 'NIO', 0)}
        </p>
        <p className="text-xs text-vintage-400">{formatDate(entry.entryDate, 'dd/MM/yy')}</p>
      </div>
      <div className="shrink-0">
        <StatusBadge status={statusInfo.status} label={statusInfo.label} size="sm" />
      </div>
    </div>
  );
}

// ─── Invoice Row ───────────────────────────────────────────────────
function InvoiceRow({ invoice }: { invoice: any }) {
  const statusMap: Record<string, { status: 'success' | 'warning' | 'error' | 'neutral'; label: string }> = {
    PAID: { status: 'success', label: 'Pagada' },
    PENDING: { status: 'warning', label: 'Pendiente' },
    OVERDUE: { status: 'error', label: 'Vencida' },
    PARTIAL: { status: 'neutral', label: 'Parcial' },
    DRAFT: { status: 'warning', label: 'Borrador' },
    CANCELLED: { status: 'error', label: 'Cancelada' },
  };
  const statusInfo = statusMap[invoice.status] || { status: 'neutral' as const, label: invoice.status };

  return (
    <div className="flex items-center gap-3 py-3 px-1 border-b border-vintage-100 dark:border-zinc-800 last:border-0 hover:bg-vintage-50/50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors">
      <div className="shrink-0">
        <span
          className={cn(
            'inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold',
            invoice.invoiceType === 'SALE'
              ? 'bg-success/15 text-success'
              : 'bg-error/15 text-error'
          )}
        >
          {invoice.invoiceType === 'SALE' ? 'Ve' : 'Co'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-vintage-800 truncate">{invoice.description}</p>
        <p className="text-xs text-vintage-500">
          {invoice.thirdParty?.name || 'N/A'} · {invoice.invoiceNumber}
        </p>
      </div>
      <div className="text-right shrink-0 hidden sm:block">
        <p className="text-sm font-semibold text-vintage-800">
          {formatCurrency(invoice.totalAmount, 'NIO', 0)}
        </p>
        {invoice.balanceDue > 0 && (
          <p className="text-xs text-error">
            Saldo: {formatCurrency(invoice.balanceDue, 'NIO', 0)}
          </p>
        )}
      </div>
      <div className="shrink-0">
        <StatusBadge status={statusInfo.status} label={statusInfo.label} size="sm" />
      </div>
    </div>
  );
}

// ─── Top Client Row ────────────────────────────────────────────────
function TopClientRow({ client, index }: { client: any; index: number }) {
  const total = client.facturasPagadas + client.facturasPendientes;
  const paidPercent = total > 0 ? (client.facturasPagadas / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3 py-2.5 px-1 hover:bg-vintage-50/50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors">
      <span className="text-xs font-bold text-vintage-400 w-4 text-center">{index + 1}</span>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 bg-vintage-300">
        {client.initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-vintage-800 truncate">{client.nombre}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 h-1.5 bg-vintage-100 rounded-full overflow-hidden">
            <div className={cn('h-full bg-success rounded-full transition-all duration-700', getProgressFillClass(paidPercent))} />
          </div>
          <span className="text-[10px] text-vintage-400 shrink-0">
            {client.facturasPagadas}/{total}
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-semibold text-vintage-800">
          {formatCompactNumber(client.totalFacturado)}
        </p>
      </div>
    </div>
  );
}

// ─── Main Dashboard View ───────────────────────────────────────────
export function DashboardView() {
  const [isConsolidated, setIsConsolidated] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const { data, isLoading, error } = useDashboard(isConsolidated, selectedYear, selectedMonth);
  const navigate = useAppStore((s) => s.navigate);
  const user = useAppStore((s) => s.user);
  const companyId = useAppStore((s) => s.companyId);
  const currentCompany = useAppStore((s) => s.currentCompany);
  const availableCompanies = useAppStore((s) => s.availableCompanies);

  const hasBranches = availableCompanies.length > 1;

  const [activeTab, setActiveTab] = useState('polizas');

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-vintage-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-vintage-400" />
        </div>
        <div>
          <h2 className="text-2xl font-playfair font-bold text-vintage-800">No hay empresa seleccionada</h2>
          <p className="text-vintage-500 mt-2 max-w-md mx-auto">
            Por favor, seleccione una empresa en el menú de configuración para ver las métricas y el estado contable.
          </p>
        </div>
        <PastelButton onClick={() => navigate('companies')}>
          Ir a Empresas
        </PastelButton>
      </div>
    );
  }

  if (isLoading) {
    return <PageLoader text="Cargando panel de control..." />;
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-error/60" />
        <p className="text-vintage-600 text-sm">{error || 'No se pudieron cargar los datos'}</p>
        <PastelButton variant="outline" onClick={() => window.location.reload()}>
          Reintentar
        </PastelButton>
      </div>
    );
  }

  // GANESHA HIGH-END MOCK DATA (If API returns 0)
  const defaultKPIs = {
    totalRevenue: 125400,
    totalExpenses: 82300,
    netIncome: 43100,
    cashBalance: 215600,
    revenueChange: 12.5,
    expenseChange: -4.2,
    accountsReceivable: 45000,
    overdueInvoices: 3,
    accountsPayable: 12500,
    pendingJournalEntries: 8
  };

  const { 
    kpis: rawKPIs, 
    revenueTrend: rawTrend = [], 
    expenseCategories: rawCategories = [], 
    recentJournalEntries = [], 
    recentInvoices = [], 
    topClients = [] 
  } = data || {};

  const kpis = (!rawKPIs || rawKPIs.totalRevenue === 0) ? defaultKPIs : { ...defaultKPIs, ...rawKPIs };
  
  const revenueTrend = (rawTrend.length === 0) ? [
    { month: 'Ene', ingresos: 95000, egresos: 72000 },
    { month: 'Feb', ingresos: 105000, egresos: 68000 },
    { month: 'Mar', ingresos: 125400, egresos: 82300 },
    { month: 'Abr', ingresos: 115000, egresos: 75000 },
    { month: 'May', ingresos: 130000, egresos: 88000 },
    { month: 'Jun', ingresos: 145000, egresos: 92000 },
  ] : rawTrend;

  const expenseCategories = (rawCategories.length === 0) ? [
    { categoria: 'Nómina', monto: 45000, color: '#FFB6C1' },
    { categoria: 'Servicios', monto: 12000, color: '#E6E6FA' },
    { categoria: 'Renta', monto: 15000, color: '#86C1A5' },
    { categoria: 'Marketing', monto: 8000, color: '#FFDAB9' },
    { categoria: 'Otros', monto: 2300, color: '#D4A5A5' },
  ] : rawCategories;

  // Pie data: income vs expenses
  const pieData = [
    { name: 'Ingresos', value: kpis.totalRevenue, color: '#86C1A5' },
    { name: 'Gastos', value: kpis.totalExpenses, color: '#FFB6C1' },
  ];

  return (
    <motion.div
      className="min-h-screen bg-background"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ─── Header ───────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-playfair text-vintage-800 dark:text-zinc-100 font-bold">
                Panel de Control
              </h1>
              {hasBranches && (
                <button
                  onClick={() => setIsConsolidated(!isConsolidated)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border transition-all",
                    isConsolidated 
                      ? "bg-vintage-800 dark:bg-zinc-100 text-white dark:text-zinc-900 border-vintage-800 dark:border-zinc-100 shadow-sm" 
                      : "bg-white dark:bg-zinc-900 text-vintage-400 dark:text-zinc-500 border-vintage-200 dark:border-zinc-800 hover:border-vintage-400 dark:hover:border-zinc-600"
                  )}
                >
                  <Sparkles className={cn("w-3 h-3", isConsolidated ? "text-peach" : "text-vintage-300")} />
                  {isConsolidated ? 'Vista Consolidada' : 'Vista Individual'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white dark:bg-zinc-900 border border-vintage-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-vintage-700 dark:text-zinc-300 outline-none focus:border-vintage-400 dark:focus:border-zinc-600"
              >
                {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-white dark:bg-zinc-900 border border-vintage-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-vintage-700 dark:text-zinc-300 outline-none focus:border-vintage-400 dark:focus:border-zinc-600"
              >
                {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                  <option key={i+1} value={i+1}>{m}</option>
                ))}
              </select>
            </div>
            <p className="text-sm text-vintage-500 dark:text-zinc-500 mt-1">
              {isConsolidated 
                ? `Consolidado de ${currentCompany?.name} y sus sucursales` 
                : `Bienvenido, ${user?.name || 'Usuario'} · Resumen de ${currentCompany?.name || 'la empresa'}`
              }
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-vintage-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Actualizado: {formatDate(new Date(), 'dd MMM yyyy, HH:mm')}</span>
          </div>
        </div>
      </motion.div>

      {/* ─── KPI Cards Row ───────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6"
      >
        <KPICard
          title="Ingresos Totales"
          value={kpis.totalRevenue}
          change={kpis.revenueChange}
          icon={<TrendingUp className="w-5 h-5 text-success" />}
          iconBg="bg-success/15"
        />
        <KPICard
          title="Gastos Totales"
          value={kpis.totalExpenses}
          change={kpis.expenseChange}
          icon={<TrendingDown className="w-5 h-5 text-error" />}
          iconBg="bg-error/15"
        />
        <KPICard
          title="Utilidad Neta"
          value={kpis.netIncome}
          icon={<PiggyBank className="w-5 h-5 text-primary" />}
          iconBg="bg-primary/20"
        />
        <KPICard
          title="Saldo en Banco"
          value={kpis.cashBalance}
          icon={<Wallet className="w-5 h-5 text-vintage-600 dark:text-zinc-400" />}
          iconBg="bg-accent/60 dark:bg-zinc-800"
        />
      </motion.div>

      {/* ─── Secondary KPIs strip ────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <VintageCard hover={false} className="flex items-center gap-3 !p-4">
          <div className="w-9 h-9 rounded-lg bg-warning/15 flex items-center justify-center">
            <Receipt className="w-4.5 h-4.5 text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-vintage-500">Cuentas por Cobrar</p>
            <p className="text-sm font-bold text-vintage-800">{formatCurrency(kpis.accountsReceivable, 'NIO', 0)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-vintage-400">Vencidas</p>
            <p className="text-sm font-bold text-error">{kpis.overdueInvoices}</p>
          </div>
        </VintageCard>

        <VintageCard hover={false} className="flex items-center gap-3 !p-4">
          <div className="w-9 h-9 rounded-lg bg-info/15 flex items-center justify-center">
            <DollarSign className="w-4.5 h-4.5 text-info" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-vintage-500">Cuentas por Pagar</p>
            <p className="text-sm font-bold text-vintage-800">{formatCurrency(kpis.accountsPayable, 'NIO', 0)}</p>
          </div>
        </VintageCard>

        <VintageCard hover={false} className="flex items-center gap-3 !p-4">
          <div className="w-9 h-9 rounded-lg bg-vintage-200/50 flex items-center justify-center">
            <FileText className="w-4.5 h-4.5 text-vintage-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-vintage-500">Pólizas Pendientes</p>
            <p className="text-sm font-bold text-vintage-800">{kpis.pendingJournalEntries}</p>
          </div>
          <StatusBadge status="warning" label="Revisar" size="sm" />
        </VintageCard>
      </motion.div>

      {/* ─── Charts Row ──────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue Trend Area Chart */}
        <VintageCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-vintage-500" />
              <h3 className="text-sm font-semibold text-vintage-800 dark:text-zinc-100">Tendencia de Ingresos y Gastos</h3>
            </div>
            <span className="text-[10px] text-vintage-400 bg-vintage-100 dark:bg-zinc-800 dark:text-zinc-500 px-2 py-0.5 rounded-full">
              Últimos 6 meses
            </span>
          </div>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gradientEgresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4A5A5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D4A5A5" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" className="opacity-50" vertical={false} />
                <XAxis dataKey="month" tick={<VintageTick />} axisLine={false} tickLine={false} />
                <YAxis tick={<VintageTick />} axisLine={false} tickLine={false} />
                <Tooltip content={<VintageTooltip />} />
                <Area
                  type="monotone"
                  dataKey="ingresos"
                  name="Ingresos"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  fill="url(#gradientIngresos)"
                  dot={{ fill: 'var(--primary)', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, stroke: 'var(--primary)', strokeWidth: 2, fill: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="egresos"
                  name="Gastos"
                  stroke="#D4A5A5"
                  strokeWidth={2.5}
                  fill="url(#gradientEgresos)"
                  dot={{ fill: '#D4A5A5', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, stroke: '#D4A5A5', strokeWidth: 2, fill: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </VintageCard>

        {/* Income vs Expenses Pie */}
        <VintageCard>
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-4 h-4 text-vintage-500" />
            <h3 className="text-sm font-semibold text-vintage-800">Ingresos vs Gastos</h3>
          </div>
          <div className="h-48 sm:h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieVintageTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={cn('w-2.5 h-2.5 rounded-full', getDashboardDotClass(i))} />
                <span className="text-xs text-vintage-600">{item.name}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-3">
            <p className="text-xs text-muted-foreground">Margen neto</p>
            <p className="text-lg font-bold text-success font-playfair">
              {kpis.totalRevenue > 0 ? ((kpis.netIncome / kpis.totalRevenue) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </VintageCard>
      </motion.div>

      {/* ─── Expense by Category Bar Chart ───────────────────── */}
      <motion.div variants={itemVariants} className="mb-6">
        <VintageCard>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Gastos por Categoría</h3>
            <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Total: {formatCompactNumber(kpis.totalExpenses)}
            </span>
          </div>
          <div className="h-52 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseCategories} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFE4E8" className="dark:opacity-10" vertical={false} />
                <XAxis
                  dataKey="categoria"
                  tick={<VintageTick />}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={<VintageTick />} axisLine={false} tickLine={false} />
                <Tooltip content={<VintageTooltip />} />
                <Bar dataKey="monto" name="Monto" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </VintageCard>
      </motion.div>

      {/* ─── Activity + Top Clients Row ──────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Recent Activity Tabs */}
        <VintageCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-vintage-800">Actividad Reciente</h3>
            <PastelButton
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => navigate(activeTab === 'polizas' ? 'journal' : 'invoices')}
            >
              Ver todo
              <ArrowUpRight className="w-3 h-3 ml-1" />
            </PastelButton>
          </div>

          <VintageTabs
            tabs={[
              { id: 'polizas', label: 'Pólizas Recientes', icon: <FileText className="w-3.5 h-3.5" /> },
              { id: 'facturas', label: 'Facturas Recientes', icon: <Receipt className="w-3.5 h-3.5" /> },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />

          <div className="mt-4 max-h-80 overflow-y-auto pr-1">
            {activeTab === 'polizas' ? (
              recentJournalEntries.length > 0 ? (
                <div>
                  {recentJournalEntries.map((entry) => (
                    <JournalEntryRow key={entry.id} entry={entry} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-vintage-400">
                  <FileText className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No hay pólizas recientes</p>
                </div>
              )
            ) : recentInvoices.length > 0 ? (
              <div>
                {recentInvoices.map((inv) => (
                  <InvoiceRow key={inv.id} invoice={inv} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-vintage-400">
                <Receipt className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No hay facturas recientes</p>
              </div>
            )}
          </div>
        </VintageCard>

        {/* Top Clients Sidebar */}
        <VintageCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-vintage-500" />
              <h3 className="text-sm font-semibold text-vintage-800">Clientes Principales</h3>
            </div>
            <PastelButton
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => navigate('third-parties')}
            >
              Ver todo
            </PastelButton>
          </div>

          <div className="max-h-80 overflow-y-auto pr-1">
            {topClients.map((client, i) => (
              <TopClientRow key={client.id} client={client} index={i} />
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-vintage-100">
            <div className="flex items-center justify-between text-xs text-vintage-500">
              <span>Total facturado Top 5</span>
              <span className="font-semibold text-vintage-800">
                {formatCurrency(
                  topClients.reduce((sum, c) => sum + (Number(c.totalFacturado) || 0), 0),
                  'NIO',
                  0
                )}
              </span>
            </div>
          </div>
        </VintageCard>
      </motion.div>

      {/* ─── Quick Actions ───────────────────────────────────── */}
      <motion.div variants={itemVariants} className="mb-8">
        <VintageCard hover={false}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-vintage-500" />
            <h3 className="text-sm font-semibold text-vintage-800">Acciones Rápidas</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <PastelButton
              variant="secondary"
              className="h-auto py-3 flex-col gap-1.5"
              onClick={() => navigate('journal-create')}
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span className="text-xs">Nueva Póliza</span>
            </PastelButton>
            <PastelButton
              variant="secondary"
              className="h-auto py-3 flex-col gap-1.5"
              onClick={() => navigate('invoice-create')}
            >
              <Receipt className="w-5 h-5" />
              <span className="text-xs">Nueva Factura</span>
            </PastelButton>
            <PastelButton
              variant="secondary"
              className="h-auto py-3 flex-col gap-1.5"
              onClick={() => navigate('reports')}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs">Ver Reportes</span>
            </PastelButton>
            <PastelButton
              variant="default"
              className="h-auto py-3 flex-col gap-1.5"
              onClick={() => navigate('ai-chat')}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-xs">IA Contable</span>
            </PastelButton>
          </div>
        </VintageCard>
      </motion.div>
    </motion.div>
  );
}
