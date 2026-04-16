import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================================
// HELPERS GENÉRICOS PARA RESPUESTAS API
// Estandarizan el formato de éxito y error en todos los endpoints.
// ============================================================

export function success(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created(data: unknown) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function notFound(message = 'Recurso no encontrado') {
  return NextResponse.json({ success: false, error: message }, { status: 404 });
}

export function serverError(message = 'Error interno del servidor') {
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}

export function unauthorized(message = 'No autorizado') {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

// ============================================================
// HELPERS PARA PAGINACIÓN
// Estandarizan los parámetros de paginación en todos los endpoints.
// ============================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function parsePagination(searchParams: URLSearchParams): Required<PaginationParams> {
  return {
    page: Math.max(1, parseInt(searchParams.get('page') || '1', 10)),
    limit: Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10))),
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================================
// HELPERS PARA VALIDACIÓN DE PARTIDA DOBLE
// CRÍTICO: Toda transacción debe cuadrar: SUM(Debe) == SUM(Haber)
// ============================================================

export interface LineItem {
  accountId: string;
  costCenterId?: string | null;
  description: string;
  debit: number;
  credit: number;
}

/**
 * Valida que las partidas de una póliza cumplan la partida doble.
 * Retorna true si cuadra, false si no.
 */
export function validateDoubleEntry(lines: LineItem[]): { valid: boolean; difference: number; totalDebit: number; totalCredit: number } {
  const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  const difference = Math.round((totalDebit - totalCredit) * 100) / 100;
  return {
    valid: difference === 0,
    difference: Math.abs(difference),
    totalDebit,
    totalCredit,
  };
}

/**
 * Valida que todas las cuentas de las partidas sean cuentas hoja (is_group=false)
 */
export async function validateLeafAccounts(lines: LineItem[]): Promise<{ valid: boolean; errors: string[] }> {
  const accountIds = lines.map(l => l.accountId);
  const accounts = await db.account.findMany({
    where: { id: { in: accountIds } },
    select: { id: true, code: true, name: true, isGroup: true },
  });

  const errors: string[] = [];
  for (const account of accounts) {
    if (account.isGroup) {
      errors.push(`La cuenta ${account.code} - ${account.name} es una cuenta título (grupo). Solo se permiten cuentas hoja en las partidas.`);
    }
  }

  // Verificar que todas las cuentas existen
  const foundIds = new Set(accounts.map(a => a.id));
  for (const line of lines) {
    if (!foundIds.has(line.accountId)) {
      errors.push(`La cuenta con ID ${line.accountId} no existe.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida que un período contable esté abierto para recibir pólizas
 */
export async function validatePeriodOpen(periodId: string): Promise<{ valid: boolean; error?: string; period?: { status: string; year: number; month: number } }> {
  const period = await db.accountingPeriod.findUnique({
    where: { id: periodId },
    select: { status: true, year: true, month: true },
  });

  if (!period) return { valid: false, error: 'Período contable no encontrado' };
  if (period.status !== 'OPEN') return { valid: false, error: `El período ${period.year}-${String(period.month).padStart(2, '0')} está cerrado. No se permiten nuevas pólizas.` };

  return { valid: true, period: period as { status: string; year: number; month: number } };
}

/**
 * Formatea un número como moneda
 */
export function formatCurrency(amount: number, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Genera el siguiente número de póliza secuencial para un período
 */
export async function generateEntryNumber(periodId: string, companyId: string): Promise<string> {
  const lastEntry = await db.journalEntry.findFirst({
    where: { periodId, companyId },
    orderBy: { entryNumber: 'desc' },
    select: { entryNumber: true },
  });

  if (!lastEntry) return '0001';

  const lastNum = parseInt(lastEntry.entryNumber, 10);
  return String(lastNum + 1).padStart(4, '0');
}
