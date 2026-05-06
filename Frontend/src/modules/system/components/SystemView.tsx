'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle2, XCircle, Server, Database as DbIcon, HardDrive, RefreshCw, AlertTriangle } from 'lucide-react';
import { VintageCard } from '@/components/ui/vintage-card';
import { StatusBadge } from '@/components/ui/vintage-ui';
import { PastelButton } from '@/components/ui/pastel-button';
import { useSystem } from '../hooks/useSystem';
import { GaneshaLoader } from '@/components/ui/ganesha-loader';

interface SystemCheck { name: string; status: 'ok' | 'warning' | 'error'; detail: string; }
interface SystemStat { label: string; value: number; icon: React.ReactNode; }

export function SystemView() {
  const { stats, health, isLoading: hookLoading, refresh } = useSystem();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hookLoading) {
      const timer = setTimeout(() => setLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [hookLoading]);

  if (loading) return <GaneshaLoader variant="compact" message="Verificando integridad del sistema..." />;

  const currentStats = [
    { label: 'Pólizas', value: stats?.entities?.journalEntries || 0, icon: <Server className="w-4 h-4 text-primary" /> },
    { label: 'Facturas', value: stats?.entities?.invoices || 0, icon: <DbIcon className="w-4 h-4 text-primary" /> },
    { label: 'Cuentas', value: stats?.entities?.accounts || 0, icon: <HardDrive className="w-4 h-4 text-primary" /> },
    { label: 'Terceros', value: stats?.entities?.thirdParties || 0, icon: <Activity className="w-4 h-4 text-primary" /> },
    { label: 'Usuarios', value: stats?.entities?.users || 0, icon: <CheckCircle2 className="w-4 h-4 text-primary" /> },
    { label: 'Auditoría', value: stats?.entities?.auditLogs || 0, icon: <XCircle className="w-4 h-4 text-primary" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-playfair font-bold text-vintage-900 dark:text-zinc-100">Sistema</h2><p className="text-sm text-vintage-600 dark:text-zinc-500 mt-1">Estado del sistema y estadísticas reales</p></div>
        <PastelButton variant="outline" size="sm" onClick={refresh} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </PastelButton>
      </div>

      <VintageCard>
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />Estado de Salud</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(health?.checks || []).map((check, i) => (
            <motion.div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card shadow-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}>
              {check.status === 'ok' ? <CheckCircle2 className="w-5 h-5 text-success dark:text-emerald-400 flex-shrink-0" /> : check.status === 'warning' ? <AlertTriangle className="w-5 h-5 text-warning dark:text-amber-400 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-error dark:text-red-400 flex-shrink-0" />}
              <div>
                <p className="text-sm font-medium text-vintage-800 dark:text-zinc-100">{check.name}</p>
                <p className="text-xs text-vintage-500 dark:text-zinc-500">{check.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </VintageCard>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {currentStats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <VintageCard variant="premium" className="text-center p-4 border-none">
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <p className="text-2xl font-bold text-vintage-800 dark:text-zinc-100">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-vintage-500 dark:text-zinc-500 uppercase tracking-widest font-black text-[9px] mt-1">{stat.label}</p>
            </VintageCard>
          </motion.div>
        ))}
      </div>

      <VintageCard>
        <h3 className="text-sm font-semibold text-vintage-800 dark:text-zinc-100 mb-4">Información del Sistema</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-vintage-100 dark:border-zinc-800"><span className="text-vintage-500 dark:text-zinc-500">Versión</span><span className="text-vintage-800 dark:text-zinc-100 font-medium">2.5.0-Enterprise</span></div>
            <div className="flex justify-between py-1 border-b border-vintage-100 dark:border-zinc-800"><span className="text-vintage-500 dark:text-zinc-500">Framework</span><span className="text-vintage-800 dark:text-zinc-100 font-medium">Next.js 15 (App Router)</span></div>
            <div className="flex justify-between py-1 border-b border-vintage-100 dark:border-zinc-800"><span className="text-vintage-500 dark:text-zinc-500">Base de Datos</span><span className="text-vintage-800 dark:text-zinc-100 font-medium">SQLite / Prisma</span></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-vintage-100 dark:border-zinc-800"><span className="text-vintage-500 dark:text-zinc-500">Estado</span><span className="text-vintage-800 dark:text-zinc-100 font-medium">{health?.status || 'UNKNOWN'}</span></div>
            <div className="flex justify-between py-1 border-b border-vintage-100 dark:border-zinc-800"><span className="text-vintage-500 dark:text-zinc-500">Última Sincronización</span><span className="text-vintage-800 dark:text-zinc-100 font-medium">{stats ? new Date(stats.lastUpdated).toLocaleString() : 'Nunca'}</span></div>
            <div className="flex justify-between py-1 border-b border-vintage-100 dark:border-zinc-800"><span className="text-vintage-500 dark:text-zinc-500">Entorno</span><span className="text-vintage-800 dark:text-zinc-100 font-medium">Producción (Live)</span></div>
          </div>
        </div>
      </VintageCard>
    </div>
  );
}
