'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle2, XCircle, Server, Database as DbIcon, HardDrive } from 'lucide-react';
import { VintageCard } from '@/components/ui/vintage-card';
import { StatusBadge } from '@/components/ui/vintage-ui';

interface SystemCheck { name: string; status: 'ok' | 'warning' | 'error'; detail: string; }
interface SystemStat { label: string; value: number; icon: React.ReactNode; }

const checks: SystemCheck[] = [
  { name: 'API Server', status: 'ok', detail: 'Tiempo de respuesta: 45ms' },
  { name: 'Base de Datos', status: 'ok', detail: 'SQLite - 24.3 MB utilizados' },
  { name: 'Autenticación', status: 'ok', detail: 'JWT tokens activos' },
  { name: 'Almacenamiento', status: 'warning', detail: '78% del espacio utilizado (3.9 GB / 5 GB)' },
  { name: 'Respaldos', status: 'ok', detail: 'Último respaldo: hace 2 horas' },
  { name: 'SSL/TLS', status: 'ok', detail: 'Certificado vigente hasta Mar 2026' },
];

const stats: SystemStat[] = [
  { label: 'Pólizas', value: 245, icon: <Server className="w-4 h-4 text-vintage-400" /> },
  { label: 'Facturas', value: 156, icon: <DbIcon className="w-4 h-4 text-vintage-400" /> },
  { label: 'Cuentas', value: 87, icon: <HardDrive className="w-4 h-4 text-vintage-400" /> },
  { label: 'Terceros', value: 42, icon: <Activity className="w-4 h-4 text-vintage-400" /> },
  { label: 'Usuarios', value: 6, icon: <CheckCircle2 className="w-4 h-4 text-vintage-400" /> },
  { label: 'Auditoría', value: 1230, icon: <XCircle className="w-4 h-4 text-vintage-400" /> },
];

export function SystemView() {
  const [loading, setLoading] = useState(true);

  useEffect(() => { setTimeout(() => setLoading(false), 800); }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-playfair font-bold text-vintage-900">Sistema</h2><p className="text-sm text-vintage-600 mt-1">Estado del sistema y estadísticas</p></div>

      <VintageCard>
        <h3 className="text-sm font-semibold text-vintage-800 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-vintage-500" />Health Check</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {checks.map((check, i) => (
            <motion.div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-vintage-200 bg-vintage-50/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}>
              {check.status === 'ok' ? <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" /> : check.status === 'warning' ? <XCircle className="w-5 h-5 text-warning flex-shrink-0" /> : <XCircle className="w-5 h-5 text-error flex-shrink-0" />}
              <div>
                <p className="text-sm font-medium text-vintage-800">{check.name}</p>
                <p className="text-xs text-vintage-500">{check.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </VintageCard>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat, i) => (
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
            <div className="flex justify-between py-1 border-b border-vintage-100"><span className="text-vintage-500">Versión</span><span className="text-vintage-800 font-medium">2.1.0</span></div>
            <div className="flex justify-between py-1 border-b border-vintage-100"><span className="text-vintage-500">Framework</span><span className="text-vintage-800 font-medium">Next.js 16</span></div>
            <div className="flex justify-between py-1 border-b border-vintage-100"><span className="text-vintage-500">Base de Datos</span><span className="text-vintage-800 font-medium">SQLite (Prisma)</span></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-vintage-100"><span className="text-vintage-500">Entorno</span><span className="text-vintage-800 font-medium">Producción</span></div>
            <div className="flex justify-between py-1 border-b border-vintage-100"><span className="text-vintage-500">Zona Horaria</span><span className="text-vintage-800 font-medium">America/Mexico_City</span></div>
            <div className="flex justify-between py-1 border-b border-vintage-100"><span className="text-vintage-500">Último Deploy</span><span className="text-vintage-800 font-medium">15 Ago 2025</span></div>
          </div>
        </div>
      </VintageCard>
    </div>
  );
}
