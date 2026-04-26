// Formatting utilities for the ERP
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

// Currency formatting
export function formatCurrency(amount: number | null | undefined, currency: string = 'NIO', decimals: number = 2): string {
  const value = (amount == null || Number.isNaN(amount)) ? 0 : amount;
  return new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Number formatting with thousands separator
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('es-NI', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Percentage formatting
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Date formatting
export function formatDate(date: string | Date, pattern: string = 'dd/MM/yyyy'): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return 'Fecha inválida';
  return format(parsed, pattern, { locale: es });
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
}

export function formatRelativeTime(date: string | Date): string {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '';
  return formatDistanceToNow(parsed, { addSuffix: true, locale: es });
}

// Short date for tables
export function formatShortDate(date: string | Date): string {
  return formatDate(date, 'dd/MM/yy');
}

// Month name
export function formatMonth(month: number): string {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[month - 1] || '';
}

// Status badge colors and labels
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // General
    ACTIVE: 'bg-success/20 text-success',
    INACTIVE: 'bg-vintage-200 text-vintage-700',
    DRAFT: 'bg-warning/20 text-warning',
    POSTED: 'bg-success/20 text-success',
    CLOSED: 'bg-vintage-200 text-vintage-700',
    LOCKED: 'bg-error/20 text-error',
    OPEN: 'bg-success/20 text-success',
    
    // Invoice statuses
    PENDING: 'bg-warning/20 text-warning',
    PARTIAL: 'bg-peach/30 text-vintage-800',
    PAID: 'bg-success/20 text-success',
    CANCELLED: 'bg-error/20 text-error',
    OVERDUE: 'bg-error/20 text-error',
    
    // Asset statuses
    DISPOSED: 'bg-vintage-200 text-vintage-700',
    FULLY_DEPRECIATED: 'bg-info/20 text-info',
    
    // Budget statuses
    APPROVED: 'bg-success/20 text-success',
  };
  return colors[status] || 'bg-vintage-200 text-vintage-700';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: 'Activo',
    INACTIVE: 'Inactivo',
    DRAFT: 'Borrador',
    POSTED: 'Publicada',
    CLOSED: 'Cerrado',
    LOCKED: 'Bloqueado',
    OPEN: 'Abierto',
    PENDING: 'Pendiente',
    PARTIAL: 'Parcial',
    PAID: 'Pagado',
    CANCELLED: 'Cancelado',
    OVERDUE: 'Vencido',
    DISPOSED: 'Disposicionado',
    FULLY_DEPRECIATED: 'Depreciado',
    APPROVED: 'Aprobado',
    DEPOSIT: 'Depósito',
    WITHDRAWAL: 'Retiro',
    TRANSFER: 'Transferencia',
    ASSET: 'Activo',
    LIABILITY: 'Pasivo',
    EQUITY: 'Patrimonio',
    INCOME: 'Ingreso',
    EXPENSE: 'Gasto',
    DEBIT: 'Debe',
    CREDIT: 'Haber',
    DIARIO: 'Diario',
    EGRESO: 'Egreso',
    INGRESO: 'Ingreso',
    TRASPASO: 'Traspaso',
    CLIENT: 'Cliente',
    SUPPLIER: 'Proveedor',
    BOTH: 'Ambos',
    SALE: 'Venta',
    PURCHASE: 'Compra',
    CHECKING: 'Cheques',
    SAVINGS: 'Ahorro',
    BANK_CREDIT: 'Crédito',
    STRAIGHT_LINE: 'Línea Recta',
    DECLINING_BALANCE: 'Saldo Decreciente',
    ADMIN: 'Administrador',
    ACCOUNTANT: 'Contador',
    MANAGER: 'Gerente',
    VIEWER: 'Visor',
    INFO: 'Info',
    WARNING: 'Advertencia',
    ERROR: 'Error',
    SUCCESS: 'Éxito',
  };
  return labels[status] || status;
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Account code formatting
export function formatAccountCode(code: string): string {
  return code;
}

// Entry type badge
export function getEntryTypeColor(type: string): string {
  const colors: Record<string, string> = {
    DIARIO: 'bg-lavender/40 text-vintage-800',
    EGRESO: 'bg-error/15 text-error',
    INGRESO: 'bg-success/15 text-success',
    TRASPASO: 'bg-peach/40 text-vintage-800',
  };
  return colors[type] || 'bg-vintage-200 text-vintage-700';
}

// Compact number (e.g., 1.2M, 345K)
export function formatCompactNumber(value?: number | null): string {
  if (value == null || Number.isNaN(value)) {
    return '0';
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

// Generate initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
