import { db } from '@/lib/db';
import { success, created, error, parsePagination, serverError, generateInvoiceNumber } from '@/lib/api-helpers';
import type { PaginatedResponse } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

// ============================================================
// AGING HELPERS - Shared logic for aging calculations
// ============================================================

interface InvoiceWithComputed extends Prisma.InvoiceGetPayload<{
  include: { thirdParty: { select: { id: true; name: true; type: true } } };
}> {
  daysOverdue?: number;
  agingBucket?: string;
}

/**
 * Computes daysOverdue and agingBucket for an invoice relative to a reference date.
 */
function computeAging(invoice: { dueDate: Date | null; status: string; balanceDue: number }, asOfDate: Date) {
  const result = { daysOverdue: 0, agingBucket: 'current' as string };

  // Only compute overdue for invoices that are not fully paid
  if (invoice.status === 'PAID' || invoice.status === 'CANCELLED' || invoice.balanceDue <= 0) {
    return result;
  }

  if (!invoice.dueDate) {
    return result;
  }

  const diffMs = asOfDate.getTime() - invoice.dueDate.getTime();
  result.daysOverdue = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  if (result.daysOverdue <= 30) {
    result.agingBucket = 'current';
  } else if (result.daysOverdue <= 60) {
    result.agingBucket = 'overdue_31_60';
  } else if (result.daysOverdue <= 90) {
    result.agingBucket = 'overdue_61_90';
  } else {
    result.agingBucket = 'overdue_90_plus';
  }

  return result;
}

// ============================================================
// GET /api/invoices - List invoices with pagination & filters
// ============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);

    const companyId = searchParams.get('companyId');
    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    const thirdPartyId = searchParams.get('thirdPartyId') || '';
    const invoiceType = searchParams.get('invoiceType') || '';
    const status = searchParams.get('status') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const search = searchParams.get('search') || '';
    const asOfDateStr = searchParams.get('asOfDate') || '';
    const asOfDate = asOfDateStr ? new Date(asOfDateStr + 'T23:59:59.999Z') : new Date();

    // Build where clause
    const where: Prisma.InvoiceWhereInput = { companyId };

    if (thirdPartyId) {
      where.thirdPartyId = thirdPartyId;
    }

    if (invoiceType && ['SALE', 'PURCHASE'].includes(invoiceType)) {
      where.invoiceType = invoiceType;
    }

    if (status && ['PENDING', 'PARTIAL', 'PAID', 'CANCELLED'].includes(status)) {
      where.status = status;
    }

    // Build date filter
    const dateFilter: Prisma.DateTimeFilter<'Invoice'> = {};
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo + 'T23:59:59.999Z');
    }
    if (Object.keys(dateFilter).length > 0) {
      where.issueDate = dateFilter;
    }

    if (search) {
      where.OR = [
        { number: { contains: search } },
        { thirdParty: { name: { contains: search } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          thirdParty: {
            select: { id: true, name: true, type: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.invoice.count({ where }),
    ]);

    // Compute aging for each invoice
    const invoicesWithAging = invoices.map((inv) => {
      const aging = computeAging(inv, asOfDate);
      return { ...inv, daysOverdue: aging.daysOverdue, agingBucket: aging.agingBucket };
    });

    const result: PaginatedResponse<InvoiceWithComputed> = {
      data: invoicesWithAging,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };

    return success(result);
  } catch (err) {
    console.error('Error listing invoices:', err);
    return serverError('Error al listar facturas');
  }
}

// ============================================================
// POST /api/invoices - Create a new invoice
// ============================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      companyId, 
      thirdPartyId, 
      invoiceType, 
      number, 
      invoiceDate, // renamed from issueDate in frontend
      issueDate,   // keep support for both
      dueDate, 
      description,
      lines = [] 
    } = body;

    const finalIssueDate = invoiceDate || issueDate;

    // Validate required fields
    if (!companyId) return error('El companyId es obligatorio');
    if (!thirdPartyId) return error('El thirdPartyId es obligatorio');
    if (!invoiceType || !['SALE', 'PURCHASE'].includes(invoiceType)) {
      return error('El invoiceType es obligatorio y debe ser SALE o PURCHASE');
    }
    if (!finalIssueDate) return error('La fecha de emisión es obligatoria');

    // Generate number if missing
    let finalNumber = number;
    if (!finalNumber || finalNumber.trim() === '') {
      finalNumber = await generateInvoiceNumber(companyId, invoiceType);
    }

    // Verify company exists
    const company = await db.company.findUnique({ where: { id: companyId } });
    if (!company) return error('La empresa especificada no existe');

    // Verify third party exists
    const thirdParty = await db.thirdParty.findUnique({ where: { id: thirdPartyId } });
    if (!thirdParty) return error('El tercero especificado no existe');

    // Calculate totals from lines if present
    let calculatedSubtotal = 0;
    let calculatedTaxAmount = 0;
    
    const invoiceLinesData = lines.map((line: any, idx: number) => {
      const q = line.quantity || 1;
      const up = line.unitPrice || 0;
      const tr = line.taxRate || 0;
      const sub = q * up;
      const tax = sub * (tr / 100);
      
      calculatedSubtotal += sub;
      calculatedTaxAmount += tax;
      
      return {
        lineNumber: idx + 1,
        description: line.description || 'Sin descripción',
        quantity: q,
        unitPrice: up,
        subtotal: sub,
        taxBase: sub,
        // taxAmount is not per line in the schema, but total for invoice
      };
    });

    const totalAmount = body.totalAmount || (calculatedSubtotal + calculatedTaxAmount);
    const subtotal = body.subtotal || calculatedSubtotal;
    const taxAmount = body.taxAmount || calculatedTaxAmount;

    // Start transaction
    const invoice = await db.$transaction(async (tx) => {
      return await tx.invoice.create({
        data: {
          companyId,
          thirdPartyId,
          invoiceType,
          number: finalNumber.trim(),
          issueDate: new Date(finalIssueDate),
          dueDate: dueDate ? new Date(dueDate) : null,
          subtotal,
          taxAmount,
          totalAmount,
          balanceDue: totalAmount,
          description: description?.trim() || null,
          status: 'PENDING',
          lines: {
            create: invoiceLinesData
          }
        },
        include: {
          thirdParty: { select: { id: true, name: true, type: true } },
          lines: true
        }
      });
    });

    return created(invoice);
  } catch (err: unknown) {
    console.error('Error creating invoice:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return error('Ya existe una factura con ese número para este tipo en la empresa');
      }
    }
    return serverError('Error al crear la factura');
  }
}
