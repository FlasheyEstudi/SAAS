import { db } from '@/lib/db';
import { success, notFound, error, serverError } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================
// GET /api/invoices/[id] - Get invoice with third party info and journal entry
// ============================================================
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        thirdParty: {
          select: { id: true, name: true, type: true, taxId: true, email: true, phone: true },
        },
        journalEntry: {
          select: {
            id: true,
            entryNumber: true,
            description: true,
            entryDate: true,
            entryType: true,
            status: true,
          },
        },
        lines: true,
        taxEntries: {
          include: { taxRate: true }
        },
        paymentSchedules: true,
      },
    });

    if (!invoice) {
      return notFound('Factura no encontrada');
    }

    // Compute days overdue
    let daysOverdue = 0;
    if (invoice.dueDate && invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && invoice.balanceDue > 0) {
      const diffMs = new Date().getTime() - invoice.dueDate.getTime();
      daysOverdue = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Compute aging bucket
    let agingBucket = 'current';
    if (daysOverdue > 90) {
      agingBucket = 'overdue_90_plus';
    } else if (daysOverdue > 60) {
      agingBucket = 'overdue_61_90';
    } else if (daysOverdue > 30) {
      agingBucket = 'overdue_31_60';
    }

    // Map lines to include total (subtotal + tax if we had tax per line, but for now just subtotal)
    const linesWithTotal = invoice.lines.map(l => ({
      ...l,
      total: l.subtotal // In the current schema, subtotal is the line's base.
    }));

    return success({
      ...invoice,
      lines: linesWithTotal,
      invoiceNumber: invoice.number, // Frontend expects invoiceNumber
      invoiceDate: invoice.issueDate, // Frontend expects invoiceDate
      paymentSchedule: invoice.paymentSchedules || [], // Frontend expects paymentSchedule (singular)
      daysOverdue,
      agingBucket,
    });
  } catch (err) {
    console.error('Error fetching invoice:', err);
    return serverError('Error al obtener la factura');
  }
}

// ============================================================
// PUT /api/invoices/[id] - Update invoice (status changes, balanceDue adjustments)
// ============================================================
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status, balanceDue, dueDate, description } = body;

    // Check invoice exists
    const existing = await db.invoice.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Factura no encontrada');
    }

    // Validate status if provided
    const validStatuses = ['PENDING', 'PARTIAL', 'PAID', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return error('El estado debe ser PENDING, PARTIAL, PAID o CANCELLED');
    }

    // Build update data
    const updateData: Prisma.InvoiceUpdateInput = {};

    if (status !== undefined) {
      updateData.status = status;
    }

    if (balanceDue !== undefined) {
      if (balanceDue < 0) {
        return error('El saldo pendiente no puede ser negativo');
      }
      updateData.balanceDue = balanceDue;

      // Auto-update status based on balanceDue if status not explicitly set
      if (status === undefined) {
        if (balanceDue <= 0) {
          updateData.status = 'PAID';
        } else if (balanceDue < existing.totalAmount) {
          updateData.status = 'PARTIAL';
        } else if (balanceDue === existing.totalAmount) {
          updateData.status = 'PENDING';
        }
      }
    }

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    const invoice = await db.invoice.update({
      where: { id },
      data: updateData,
      include: {
        thirdParty: {
          select: { id: true, name: true, type: true },
        },
        journalEntry: {
          select: {
            id: true,
            entryNumber: true,
            description: true,
            entryDate: true,
            entryType: true,
            status: true,
          },
        },
      },
    });

    return success(invoice);
  } catch (err: unknown) {
    console.error('Error updating invoice:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return error('Ya existe una factura con ese número para este tipo en la empresa');
      }
    }
    return serverError('Error al actualizar la factura');
  }
}

// ============================================================
// DELETE /api/invoices/[id] - Delete only if DRAFT/PENDING and no journal entry linked
// ============================================================
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const invoice = await db.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return notFound('Factura no encontrada');
    }

    // Only allow deletion if DRAFT/PENDING (schema uses PENDING as initial status)
    if (!['PENDING'].includes(invoice.status)) {
      return error(
        `No se puede eliminar la factura. Solo se pueden eliminar facturas en estado PENDING. Estado actual: ${invoice.status}`
      );
    }

    // Check if journal entry is linked
    if (invoice.journalEntryId) {
      return error(
        'No se puede eliminar la factura. Tiene una póliza contable ligada.'
      );
    }

    await db.invoice.delete({ where: { id } });

    return success({ deleted: true, id });
  } catch (err) {
    console.error('Error deleting invoice:', err);
    return serverError('Error al eliminar la factura');
  }
}
