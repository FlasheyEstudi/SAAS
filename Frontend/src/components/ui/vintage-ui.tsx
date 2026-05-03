'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Animated status indicator
export function StatusBadge({
  status,
  label,
  size = 'sm',
}: {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  label: string;
  size?: 'xs' | 'sm' | 'md';
}) {
  const statusStyles = {
    success: 'bg-success/15 dark:bg-emerald-950/30 text-success dark:text-emerald-400 border-success/30 dark:border-emerald-800/50',
    warning: 'bg-warning/15 dark:bg-amber-950/30 text-warning dark:text-amber-400 border-warning/30 dark:border-amber-800/50',
    error: 'bg-error/15 dark:bg-red-950/30 text-error dark:text-red-400 border-error/30 dark:border-red-800/50',
    info: 'bg-info/15 dark:bg-sky-950/30 text-info dark:text-sky-400 border-info/30 dark:border-sky-800/50',
    neutral: 'bg-vintage-100 dark:bg-zinc-800 text-vintage-700 dark:text-zinc-400 border-vintage-200 dark:border-zinc-700',
  };

  const badgePadding = {
    xs: 'px-1.5 py-0 text-[10px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const dotSize = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full border transition-all duration-300',
        badgePadding[size],
        statusStyles[status]
      )}
    >
      <span
        className={cn(
          'rounded-full',
          dotSize[size],
          status === 'success' && 'bg-success',
          status === 'warning' && 'bg-warning',
          status === 'error' && 'bg-error',
          status === 'info' && 'bg-info',
          status === 'neutral' && 'bg-vintage-400'
        )}
      />
      {label}
    </span>
  );
}

// Animated counter for KPIs
export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 2,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}) {
  const formatted = new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  return (
    <motion.span
      className={cn('tabular-nums', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {prefix}{formatted}{suffix}
    </motion.span>
  );
}

// Empty state component
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {icon && (
        <div className="w-16 h-16 rounded-full bg-vintage-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-vintage-400 dark:text-zinc-600">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-playfair text-vintage-800 dark:text-zinc-200 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-vintage-600 max-w-sm mb-4">{description}</p>
      )}
      {action}
    </motion.div>
  );
}

// Loading skeleton with shimmer
export function VintageSkeleton({ className, lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div className={cn('space-y-3 vintage-skeleton', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-vintage-100 dark:bg-zinc-800 rounded shimmer-bg',
            i === lines - 1 ? 'w-[60%]' : 'w-full',
            i === 0 ? 'delay-0' : i === 1 ? 'delay-100' : i === 2 ? 'delay-200' : 'delay-300'
          )}
        />
      ))}
    </div>
  );
}

// Full page loading spinner
export function PageLoader({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 animate-fade-in">
      <div className="relative">
        <div className="w-20 h-20 border-2 border-primary/10 border-t-primary rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.img 
            src="/GaneshaLogo.png" 
            alt="Ganesha Logo"
            className="w-10 h-10 object-contain"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </div>
      <p className="text-xs text-vintage-500 dark:text-zinc-400 font-bold uppercase tracking-[0.3em] animate-pulse">
        {text}
      </p>
    </div>
  );
}

// Confirm dialog
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  loading = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
  children?: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-card dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl border border-vintage-200 dark:border-zinc-800"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <h3 className="text-lg font-playfair text-vintage-800 dark:text-zinc-100 mb-2">{title}</h3>
        <p className="text-sm text-vintage-600 dark:text-zinc-400 mb-4">{description}</p>
        
        {children && <div className="mb-6">{children}</div>}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl border border-vintage-200 dark:border-zinc-800 text-vintage-700 dark:text-zinc-300 hover:bg-vintage-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm rounded-xl text-white transition-all flex items-center gap-2 ${
              variant === 'destructive'
                ? 'bg-error hover:bg-error/80 disabled:bg-error/50'
                : 'bg-vintage-400 hover:bg-vintage-500 disabled:bg-vintage-300'
            }`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Tab navigation for views
export function VintageTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 bg-vintage-100 dark:bg-zinc-800/50 rounded-xl p-1 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all duration-300 whitespace-nowrap',
            active === tab.id
              ? 'bg-white dark:bg-zinc-700 text-vintage-800 dark:text-white shadow-sm font-medium'
              : 'text-vintage-600 dark:text-zinc-400 hover:text-vintage-800 dark:hover:text-zinc-200 hover:bg-vintage-50 dark:hover:bg-zinc-800'
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

import * as React from 'react';
