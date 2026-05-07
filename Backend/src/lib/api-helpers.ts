import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================================
// AUTH VALIDATION
// ============================================================

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string | null; // Moneda base de la empresa
  availableCompanies: { id: string, name: string, role: string }[];
}

/**
 * Valida si un periodo contable está abierto para transacciones
 */
export async function ensurePeriodOpen(companyId: string, date: Date): Promise<boolean> {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const period = await db.accountingPeriod.findFirst({
    where: { companyId, year, month }
  });
  return period?.status === 'OPEN';
}

export async function validateAuth(request: Request): Promise<AuthUser | null> {
  try {
    let token = '';
    const authHeader = request.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const matches = cookieHeader.match(/auth_token=([^;]+)/);
        if (matches) token = matches[1];
      }
    }

    if (!token) return null;

    // 1. Decodificar y verificar firma HMAC
    const decodedStr = Buffer.from(token, 'base64').toString('utf-8');
    const [payloadStr, signature] = decodedStr.split('.');
    
    if (!payloadStr || !signature) return null;

    const crypto = await import('crypto');
    const secret = process.env.NEXTAUTH_SECRET || 'ganesha_super_secret_123';
    const expectedSignature = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');

    if (signature !== expectedSignature) {
      console.warn('❌ Intento de suplantación de token detectado');
      return null;
    }

    const payload = JSON.parse(payloadStr);
    
    // 2. Verificar expiración
    if (payload.exp && payload.exp < Date.now()) {
      console.warn('❌ Token expirado');
      return null;
    }

    const userId = payload.userId;
    if (!userId) return null;

    // 3. Obtener usuario
    const user = await db.user.findFirst({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        companyId: true,
        name: true,
        email: true,
        role: true,
        memberships: {
          include: {
            company: {
              select: { id: true, name: true }
            }
          }
        }
      },
    });

    if (!user) return null;

    let availableCompanies = user.memberships.map(m => ({
      id: m.companyId,
      name: m.company.name,
      role: m.role
    }));

    // 4. Auto-curación (Fixing Race Condition with await)
    if (availableCompanies.length === 0 && user.companyId) {
      try {
        const defaultCompany = await db.company.findUnique({ where: { id: user.companyId } });
        if (defaultCompany) {
          console.log('🛡️ Auto-healing membership for company:', user.companyId);
          // Usamos await para evitar race conditions
          await db.userCompany.create({
            data: { userId: user.id, companyId: user.companyId, role: 'OWNER' }
          }).catch(() => {}); // Ignorar si ya existe

          availableCompanies = [{
            id: defaultCompany.id,
            name: defaultCompany.name,
            role: 'OWNER'
          }];
        }
      } catch (e) {
        console.error('Error auto-healing companies:', e);
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      companyId: user.companyId,
      availableCompanies
    };
  } catch (err) {
    console.error('Auth validation error:', err);
    return null;
  }
}

export function requireAuth(user: AuthUser | null) {
  if (!user) {
    return unauthorized('Token de autenticación requerido');
  }
  return null;
}

/**
 * Valida que el usuario tenga acceso a una empresa específica.
 */
export function requireCompanyAccess(user: AuthUser, companyId: string) {
  const hasAccess = user.availableCompanies.some(c => c.id === companyId);
  if (!hasAccess) {
    return unauthorized('No tienes acceso a esta empresa');
  }
  return null;
}

/**
 * Valida que el usuario NO tenga rol de VISOR para acciones de escritura.
 */
export function ensureNotViewer(user: AuthUser) {
  if (user.role === 'VIEWER') {
    return error('Tu rol de Visor no permite realizar esta acción', 403);
  }
  return null;
}

/**
 * Valida que el usuario sea ADMINISTRADOR para acciones críticas.
 */
export function ensureAdmin(user: AuthUser) {
  if (user.role !== 'ADMIN') {
    return error('Se requieren privilegios de Administrador para esta acción', 403);
  }
  return null;
}

// ============================================================
// HELPERS GENÉRICOS PARA RESPUESTAS API
// Estandarizan el formato de éxito y error en todos los endpoints.
// ============================================================

// Helper para serializar objetos que contienen Decimal de Prisma
// Helper para serializar objetos que contienen Decimal de Prisma y evitar errores circulares
function serialize(data: any): any {
  const cache = new Set();
  const serialized = JSON.stringify(data, (key, value) => {
    // Manejo de Decimal (Prisma)
    if (value && typeof value === 'object' && value.d && value.s && value.e) {
      return Number(value);
    }
    // Manejo de BigInt
    if (typeof value === 'bigint') {
      return value.toString();
    }
    // Evitar referencias circulares
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) return '[Circular]';
      cache.add(value);
    }
    return value;
  });
  return JSON.parse(serialized);
}

export function success(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data: serialize(data) }, { status });
}

export function created(data: unknown) {
  return NextResponse.json({ success: true, data: serialize(data) }, { status: 201 });
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
  const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
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
export function formatCurrency(amount: number, currency = 'NIO'): string {
  return new Intl.NumberFormat('es-NI', {
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

  // Extract digits only from the end of the string
  const match = lastEntry.entryNumber.match(/(\d+)$/);
  if (!match) return '0001';

  const lastNum = parseInt(match[1], 10);
  const nextNum = lastNum + 1;
  
  // Keep the same length as the original number part
  return String(nextNum).padStart(match[1].length, '0');
}

/**
 * Genera el siguiente número de factura secuencial por empresa y tipo
 */
export async function generateInvoiceNumber(companyId: string, invoiceType: 'SALE' | 'PURCHASE'): Promise<string> {
  const prefix = invoiceType === 'SALE' ? 'FC' : 'FP';
  const lastInvoice = await db.invoice.findFirst({
    where: { companyId, invoiceType },
    orderBy: { number: 'desc' },
    select: { number: true },
  });

  if (!lastInvoice) return `${prefix}-0001`;

  const match = lastInvoice.number.match(/\-(\d+)$/);
  if (!match) return `${prefix}-0001`;

  const nextNum = parseInt(match[1], 10) + 1;
  return `${prefix}-${String(nextNum).padStart(4, '0')}`;
}
