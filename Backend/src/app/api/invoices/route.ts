import { db } from '@/lib/db';
import {
  success,
  error,
  parsePagination,
  serverError,
  generateInvoiceNumber,
  validateAuth,
  requireAuth,
  ensurePeriodOpen,
} from '@/lib/api-helpers';
import { invoiceSchema } from '@/lib/schemas/inventory';
import { logAuditTx } from '@/lib/audit-service';
import { generateInvoiceJournalEntry } from '@/lib/accounting-service';
import { NextRequest } from 'next/server';

// ============================================================
// AGING HELPERS - Shared logic for aging calculations
// ============================================================
function computeAging(invoice: { dueDate: Date | null; status: any; balanceDue: any }, asOfDate: Date) {
  const result = { daysOverdue: 0, agingBucket: 'current' as string };

  if (invoice.status === 'PAID' || invoice.status === 'CANCELLED' || Number(invoice.balanceDue) <= 0) {
    return result;
  }

  if (!invoice.dueDate) return result;

  const diffMs = asOfDate.getTime() - invoice.dueDate.getTime();
  result.daysOverdue = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  if (result.daysOverdue <= 30) result.agingBucket = 'current';
  else if (result.daysOverdue <= 60) result.agingBucket = 'overdue_31_60';
  else if (result.daysOverdue <= 90) result.agingBucket = 'overdue_61_90';
  else result.agingBucket = 'overdue_90_plus';

  return result;
}

// ============================================================
// GET /api/invoices - List invoices with pagination & filters
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const { searchParams } = request.nextUrl;
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);

    const companyId = searchParams.get('companyId');
    if (!companyId) return error('El parámetro companyId es obligatorio');

    const thirdPartyId = searchParams.get('thirdPartyId');
    const invoiceType = searchParams.get('invoiceType');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    const asOfDateStr = searchParams.get('asOfDate');
    const asOfDate = asOfDateStr ? new Date(asOfDateStr + 'T23:59:59.999Z') : new Date();

    const where: any = { companyId };
    if (thirdPartyId) where.thirdPartyId = thirdPartyId;
    if (invoiceType) where.invoiceType = invoiceType as any;
    if (status) where.status = status as any;

    if (dateFrom || dateTo) {
      where.issueDate = {};
      if (dateFrom) where.issueDate.gte = new Date(dateFrom);
      if (dateTo) where.issueDate.lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { thirdParty: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          thirdParty: { select: { id: true, name: true, type: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.invoice.count({ where }),
    ]);

    const invoicesWithAging = invoices.map((inv) => {
      const aging = computeAging(inv as any, asOfDate);
      return { ...inv, daysOverdue: aging.daysOverdue, agingBucket: aging.agingBucket };
    });

    return success({
      data: invoicesWithAging,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error('[GET /api/invoices]', err);
    return serverError();
  }
}

// ============================================================
// POST /api/invoices - Create a new invoice
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const body = await request.json();
    
    // 1. Validar con Zod (100/100)
    // Support legacy 'invoiceDate' as 'issueDate' if needed
    if (body.invoiceDate && !body.issueDate) body.issueDate = body.invoiceDate;
    
    const result = invoiceSchema.safeParse(body);
    if (!result.success) {
      return error(result.error.issues[0].message);
    }
    const data = result.data;

    // VALIDACIÓN DE PERIODO ABIERTO (Audit M2/Security)
    const isOpen = await ensurePeriodOpen(data.companyId, new Date(data.issueDate));
    if (!isOpen) {
      return error('No se pueden crear facturas en un periodo contable cerrado o bloqueado');
    }

    // 2. Generar número si falta
    let finalNumber = data.number;
    if (!finalNumber || finalNumber.trim() === '') {
      finalNumber = await generateInvoiceNumber(data.companyId, data.invoiceType);
    }

    // 3. Crear en transacción con Auditoría
    const invoice = await db.$transaction(async (tx) => {
      const newInvoice = await tx.invoice.create({
        data: {
          companyId: data.companyId,
          thirdPartyId: data.thirdPartyId,
          invoiceType: data.invoiceType,
          number: finalNumber.trim(),
          issueDate: new Date(data.issueDate),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          subtotal: data.subtotal,
          taxAmount: data.taxAmount,
          totalAmount: data.totalAmount,
          balanceDue: data.balanceDue,
          description: data.description?.trim() || null,
          status: data.status as any,
          lines: {
            create: data.lines.map((l) => ({
              lineNumber: l.lineNumber,
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              unit: l.unit,
              discountRate: l.discountRate,
              subtotal: l.subtotal,
              taxBase: l.taxBase,
              accountId: l.accountId,
              costCenterId: l.costCenterId,
            })),
          },
        },
        include: {
          thirdParty: { select: { id: true, name: true } },
          lines: true,
        },
      });

      await logAuditTx(tx, {
        companyId: data.companyId,
        userId: user!.id,
        action: 'CREATE',
        entityType: 'Invoice',
        entityId: newInvoice.id,
        entityLabel: `Factura ${finalNumber}`,
        newValues: newInvoice,
      });

      // Generar Asiento Contable Automático
      await generateInvoiceJournalEntry(tx, newInvoice.id, user!.id);

      return newInvoice;
    });

    return success(invoice, 201);
  } catch (err) {
    console.error('[POST /api/invoices]', err);
    return serverError();
  }
}
