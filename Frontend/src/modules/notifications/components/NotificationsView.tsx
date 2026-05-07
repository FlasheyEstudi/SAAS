'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  CheckCheck, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  ChevronRight,
  ShieldAlert,
  Trash2,
  Inbox
} from 'lucide-react';
import { VintageCard } from '@/components/ui/vintage-card';
import { PastelButton } from '@/components/ui/pastel-button';
import { GaneshaLoader } from '@/components/ui/ganesha-loader';
import { formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { useNotifications } from '../hooks/useNotifications';

import { useAppStore } from '@/lib/stores/useAppStore';

export function NotificationsView() {
  const navigate = useAppStore((s) => s.navigate);
  const { 
    notifications, 
    isLoading, 
    markAsRead, 
    markAllAsRead, 
    isMarkingRead 
  } = useNotifications();

  const unread = (notifications || []).filter((n: any) => !n.isRead);

  const handleNotificationClick = (notif: any) => {
    // 1. Mark as read if unread
    if (!notif.isRead) {
      markAsRead(notif.id);
    }

    // 2. Smart Navigation based on entity metadata
    if (notif.entityType === 'INVOICE' && notif.entityId) {
      navigate('invoice-detail', { id: notif.entityId });
    } else if (notif.entityType === 'JOURNAL_ENTRY' && notif.entityId) {
      navigate('journal-detail', { id: notif.entityId });
    } else if (notif.entityType === 'PERIOD') {
      navigate('periods');
    } else if (notif.entityType === 'BANK_RECONCILIATION') {
      navigate('banks');
    }
  };

  if (isLoading) {
    return <GaneshaLoader variant="full" message="Sincronizando Alertas Inteligentes..." />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Bell className="w-5 h-5 text-primary" />
             </div>
             <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-foreground">
               Centro de <span className="text-primary">Inteligencia</span>
             </h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
            Protocolos de alerta y sugerencias generadas por el motor de salud de Ganesha. 
            Mantén tu soberanía financiera monitoreando cada aviso.
          </p>
        </div>

        {unread.length > 0 && (
          <PastelButton 
            variant="default" 
            onClick={() => markAllAsRead()}
            className="shadow-lg shadow-primary/20"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Marcar todo como leído
          </PastelButton>
        )}
      </div>

      {/* --- LIST --- */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {notifications.length > 0 ? (
            notifications.map((notif: any, i: number) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
              >
                <VintageCard 
                  variant="premium" 
                  hover={!notif.isRead}
                  className={cn(
                    "group border-none transition-all duration-500 cursor-pointer",
                    notif.isRead ? "opacity-60 grayscale-[0.5]" : "ring-1 ring-white/5 bg-zinc-950/40"
                  )}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="flex items-start gap-3 sm:gap-5">
                    <div className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl transition-transform group-hover:scale-110",
                      notif.type === 'WARNING' ? "bg-orange-500/10 text-orange-500" : "bg-primary/10 text-primary"
                    )}>
                      {notif.type === 'WARNING' ? <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" /> : <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </div>

                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            {notif.type === 'WARNING' ? 'Protocolo Crítico' : 'Asistente IA'}
                          </span>
                          <div className="h-1 w-1 rounded-full bg-white/20" />
                          <div className="flex items-center gap-1 opacity-40">
                             <Clock className="w-3 h-3" />
                             <span className="text-[9px] font-bold uppercase">
                               {formatDate(notif.createdAt, 'dd MMM, HH:mm')}
                             </span>
                          </div>
                        </div>
                        {!notif.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(234,88,12,0.5)]" />
                        )}
                      </div>

                      <h3 className={cn(
                        "text-lg font-bold tracking-tight text-foreground mb-1",
                        notif.isRead ? "font-medium" : "font-black"
                      )}>
                        {notif.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                        {notif.message}
                      </p>
                    </div>

                    <div className="hidden md:flex flex-col items-end justify-center shrink-0">
                       <div className="p-2 rounded-xl transition-all text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 duration-300">
                         <ChevronRight className="w-5 h-5" />
                       </div>
                    </div>
                  </div>
                </VintageCard>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 space-y-6 opacity-30"
            >
              <div className="w-24 h-24 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5">
                 <Inbox className="w-10 h-10" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black uppercase tracking-widest">Sistema en Paz</h3>
                <p className="text-xs font-bold uppercase tracking-widest opacity-60">No se detectan anomalías financieras</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
