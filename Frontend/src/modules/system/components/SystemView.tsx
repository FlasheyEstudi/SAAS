'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle2, XCircle, Server, Database as DbIcon, HardDrive, RefreshCw, AlertTriangle } from 'lucide-react';
import { VintageCard } from '@/components/ui/vintage-card';
import { StatusBadge } from '@/components/ui/vintage-ui';
import { PastelButton } from '@/components/ui/pastel-button';
import { useSystem } from '../hooks/useSystem';

interface SystemCheck { name: string; status: 'ok' | 'warning' | 'error'; detail: string; }
interface SystemStat { label: string; value: number; icon: React.ReactNode; }

export function SystemView() {
  const { stats, health, isLoading, refresh } = useSystem();

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  const currentStats = [
    { label: 'Pólizas', value: stats?.entities?.journalEntries || 0, icon: <Server className="w-4 h-4 text-vintage-400" /> },
    { label: 'Facturas', value: stats?.entities?.invoices || 0, icon: <DbIcon className="w-4 h-4 text-vintage-400" /> },
    { label: 'Cuentas', value: stats?.entities?.accounts || 0, icon: <HardDrive className="w-4 h-4 text-vintage-400" /> },
    { label: 'Terceros', value: stats?.entities?.thirdParties || 0, icon: <Activity className="w-4 h-4 text-vintage-400" /> },
    { label: 'Usuarios', value: stats?.entities?.users || 0, icon: <CheckCircle2 className="w-4 h-4 text-vintage-400" /> },
    { label: 'Auditoría', value: stats?.entities?.auditLogs || 0, icon: <XCircle className="w-4 h-4 text-vintage-400" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-playfair font-bold text-vintage-900">Sistema</h2><p className="text-sm text-vintage-600 mt-1">Estado del sistema y estadísticas reales</p></div>
        <PastelButton variant="outline" size="sm" onClick={refresh} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </PastelButton>
      </div>

      <VintageCard>
        <h3 className="text-sm font-semibold text-vintage-800 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-vintage-500" />Health Check</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(health?.checks || []).map((check, i) => (
            <motion.div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-vintage-200 bg-vintage-50/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}>
              {check.status === 'ok' ? <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" /> : check.status === 'warning' ? <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" /> : <XCircle className="w-5 h-5 text-error flex-shrink-0" />}
              <div>
                <p className="text-sm font-medium text-vintage-800">{check.name}</p>
                <p className="text-xs text-vintage-500">{check.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </VintageCard>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {currentStats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <VintageCard className="text-center p-4">
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <p className="text-2xl font-bold text-vintage-800">{stat.value.toLocaleString()}</p>
              <p className="text-xs text-vintage-500">{stat.label}</p>
            </VintageCard>
          </motion.div>
        ))}
      </div>

      <VintageCard>
        <h3 className="text-sm font-semibold text-vintage-800 mb-4">Información del Sistema</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-vintage-100"><span className="text-vintage-500">Versión</span><span className="text-vintage-800 font-medium">2.5.0-Enterprise</span></div>
            <div className="flex justify-between py-1 border-b border-vintage-100"><span className="text-vintage-500">Framework</span><span className="text-vintage-800 font-medium">Next.js 15 (App Router)</span></div>
            <div className="flex justify-between py-1 border-b border-vintage-100"><span className="text-vintage-500">Base de Datos</span><span className="text-vintage-800 font-medium">PostgreSQL / Prisma</span></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-vintage-100"><span className="text-vintage-500">Estado</span><span className="text-vintage-800 font-medium">{health?.status || 'UNKNOWN'}</span></div>
            <div className="flex justify-between py-1 border-b border-vintage-100"><span className="text-vintage-500">Última Sincronización</span><span className="text-vintage-800 font-medium">{stats ? new Date(stats.lastUpdated).toLocaleString() : 'Nunca'}</span></div>
            <div className="flex justify-between py-1 border-b border-vintage-100"><span className="text-vintage-500">Entorno</span><span className="text-vintage-800 font-medium">Producción (Live)</span></div>
          </div>
        </div>
      </VintageCard>
    </div>
  );
}
