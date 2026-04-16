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
  size?: 'sm' | 'md';
}) {
  const statusStyles = {
    success: 'bg-success/15 text-success border-success/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    error: 'bg-error/15 text-error border-error/30',
    info: 'bg-info/15 text-info border-info/30',
    neutral: 'bg-vintage-100 text-vintage-700 border-vintage-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        statusStyles[status]
      )}
    >
      <span
        className={cn(
          'rounded-full',
          size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
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
        <div className="w-16 h-16 rounded-full bg-vintage-100 flex items-center justify-center mb-4 text-vintage-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-playfair text-vintage-800 mb-1">{title}</h3>
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
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-vintage-100 rounded shimmer-bg"
          style={{
            width: i === lines - 1 ? '60%' : '100%',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

// Full page loading spinner
export function PageLoader({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 animate-fade-in">
      <Loader2 className="w-8 h-8 text-vintage-400 animate-spin" />
      <p className="text-sm text-vintage-600 font-playfair">{text}</p>
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
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
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
        className="relative bg-card rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl border border-vintage-200"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <h3 className="text-lg font-playfair text-vintage-800 mb-2">{title}</h3>
        <p className="text-sm text-vintage-600 mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl border border-vintage-200 text-vintage-700 hover:bg-vintage-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-xl text-white transition-colors ${
              variant === 'destructive'
                ? 'bg-error hover:bg-error/80'
                : 'bg-vintage-400 hover:bg-vintage-500'
            }`}
          >
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
    <div className="flex gap-1 bg-vintage-100 rounded-xl p-1 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all duration-300 whitespace-nowrap',
            active === tab.id
              ? 'bg-white text-vintage-800 shadow-sm font-medium'
              : 'text-vintage-600 hover:text-vintage-800 hover:bg-vintage-50'
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
