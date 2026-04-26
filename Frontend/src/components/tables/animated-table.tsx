'use client';

import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

// Animated table component
export function AnimatedTable({
  headers,
  data,
  keyExtractor,
  renderRow,
  onRowClick,
  emptyMessage = 'No hay datos para mostrar',
  emptyIcon,
  isLoading,
  className,
}: {
  headers: { key: string; label: string; align?: 'left' | 'center' | 'right'; className?: string }[];
  data: any[];
  keyExtractor: (row: any) => string;
  renderRow: (row: any, index: number) => React.ReactNode;
  onRowClick?: (row: any) => void;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}) {
    return (
      <div className={cn('bg-card dark:bg-zinc-900 border border-vintage-200 dark:border-zinc-800 rounded-xl overflow-hidden', className)}>
        <div className="p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-vintage-100 dark:bg-zinc-800 rounded shimmer-bg" style={{ width: `${80 + Math.random() * 20}%` }} />
          ))}
        </div>
      </div>
    );

  return (
    <div className={cn('bg-card dark:bg-zinc-900 border border-vintage-200 dark:border-zinc-800 rounded-xl overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-vintage-200 dark:border-zinc-800 bg-vintage-50/50 dark:bg-zinc-800/20">
              {headers.map((header) => (
                <th
                  key={header.key}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold text-vintage-700 dark:text-zinc-400 uppercase tracking-wider',
                    header.align === 'center' && 'text-center',
                    header.align === 'right' && 'text-right',
                    header.className
                  )}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-vintage-100 dark:divide-zinc-800">
            <AnimatePresence>
              {!Array.isArray(data) || data.length === 0 ? (
                <tr>
                  <td colSpan={headers.length} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {emptyIcon && <span className="text-vintage-300 dark:text-zinc-700 text-3xl">{emptyIcon}</span>}
                      <p className="text-sm text-vintage-600 dark:text-zinc-500">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <motion.tr
                    key={keyExtractor(row)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                    className={cn(
                      'transition-colors duration-200',
                      onRowClick && 'cursor-pointer hover:bg-vintage-50 dark:hover:bg-zinc-800/40',
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {renderRow(row, index)}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Pagination component
export function Pagination({
  page,
  totalPages,
  onPageChange,
  total,
  limit,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total: number;
  limit: number;
}) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between py-3 px-1">
      <p className="text-sm text-vintage-600 dark:text-zinc-500">
        Mostrando {start}-{end} de {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm rounded-lg border border-vintage-200 dark:border-zinc-800 text-vintage-700 dark:text-zinc-400 hover:bg-vintage-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>
        {getPageNumbers().map((p, i) =>
          typeof p === 'string' ? (
            <span key={`dots-${i}`} className="px-2 text-vintage-400">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg transition-colors',
                page === p
                  ? 'bg-vintage-400 dark:bg-zinc-700 text-white dark:text-zinc-100 font-medium'
                  : 'text-vintage-700 dark:text-zinc-400 hover:bg-vintage-50 dark:hover:bg-zinc-800 border border-transparent'
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm rounded-lg border border-vintage-200 dark:border-zinc-800 text-vintage-700 dark:text-zinc-400 hover:bg-vintage-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

// Search filter bar
export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters,
  activeFilters,
  onFilterChange,
  onClearFilters,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: { key: string; label: string; options: { value: string; label: string }[] }[];
  activeFilters?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vintage-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-card dark:bg-zinc-900 border border-vintage-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-vintage-400 dark:focus:ring-zinc-700 focus:border-vintage-400 dark:focus:border-zinc-700 transition-all text-vintage-900 dark:text-zinc-100"
          />
        </div>
        {filters && filters.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border transition-all',
              showFilters || (activeFilters && Object.values(activeFilters).some(Boolean))
                ? 'border-vintage-400 dark:border-zinc-600 bg-vintage-50 dark:bg-zinc-800 text-vintage-800 dark:text-zinc-100'
                : 'border-vintage-200 dark:border-zinc-800 text-vintage-600 dark:text-zinc-400 hover:bg-vintage-50 dark:hover:bg-zinc-800'
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </button>
        )}
        {activeFilters && Object.values(activeFilters).some(Boolean) && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs text-vintage-500 hover:text-vintage-700 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      <AnimatePresence>
        {showFilters && filters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-3 p-3 bg-vintage-50 dark:bg-zinc-800/40 rounded-xl border border-vintage-200 dark:border-zinc-800">
              {filters.map((filter) => (
                <select
                  key={filter.key}
                  value={activeFilters?.[filter.key] || ''}
                  onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                  className="px-3 py-2 text-sm bg-card dark:bg-zinc-900 border border-vintage-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-vintage-400 dark:focus:ring-zinc-700 text-vintage-800 dark:text-zinc-300"
                >
                  <option value="">{filter.label}</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
