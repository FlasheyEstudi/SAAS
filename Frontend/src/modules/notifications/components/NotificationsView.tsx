'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { StatusBadge, EmptyState } from '@/components/ui/vintage-ui';
import { formatRelativeTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

import { useNotifications } from '../hooks/useNotifications';

const typeIcons: Record<string, string> = { INFO: 'ℹ️', WARNING: '⚠️', ERROR: '❌', SUCCESS: '✅' };
const typeBg: Record<string, string> = { INFO: 'bg-info/10 border-info/20', WARNING: 'bg-warning/10 border-warning/20', ERROR: 'bg-error/10 border-error/20', SUCCESS: 'bg-success/10 border-success/20' };

export function NotificationsView() {
  const { notifications, isLoading: loading } = useNotifications();

  const unread = (notifications || []).filter(n => !n.isRead);
  const read = (notifications || []).filter(n => n.isRead);

  const markRead = (id: string) => { toast.message('Función pendiente de API POST /read'); };
  const markAllRead = () => { toast.message('Función pendiente de API POST /mark-all-read'); };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-vintage-200 border-t-vintage-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-vintage-900">Notificaciones</h2>
          <p className="text-sm text-vintage-600 mt-1">{unread.length} sin leer</p>
        </div>
        {unread.length > 0 && <PastelButton variant="outline" size="sm" onClick={markAllRead}><CheckCheck className="w-4 h-4 mr-2" />Leer todo</PastelButton>}
      </div>

      <div className="space-y-3 max-h-[70vh] overflow-y-auto">
        {(notifications || []).map((n: any, i: number) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              'flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-sm',
              n.isRead ? 'bg-card border-vintage-100 opacity-75' : cn('bg-card border', typeBg[n.type])
            )}
            onClick={() => markRead(n.id)}
          >
            <span className="text-xl mt-0.5">{typeIcons[n.type]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={cn('text-sm', n.isRead ? 'font-medium text-vintage-600' : 'font-semibold text-vintage-800')}>{n.title}</h4>
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-vintage-400 flex-shrink-0" />}
              </div>
              <p className="text-xs text-vintage-500 mt-0.5">{n.message}</p>
              <p className="text-[10px] text-vintage-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
            </div>
            {!n.isRead && (
              <button className="p-1.5 rounded-lg hover:bg-vintage-100 text-vintage-400 hover:text-vintage-600 transition-colors flex-shrink-0" title="Marcar como leída">
                <Check className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        ))}
        {(!notifications || notifications.length === 0) && (
          <EmptyState icon={<Bell className="w-8 h-8" />} title="Sin notificaciones" description="No tienes notificaciones nuevas" />
        )}
      </div>
    </div>
  );
}
