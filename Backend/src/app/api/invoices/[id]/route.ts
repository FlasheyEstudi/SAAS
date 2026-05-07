import { db } from '@/lib/db';
import { success, error, serverError, ensurePeriodOpen, validateAuth, requireAuth, ensureNotViewer } from '@/lib/api-helpers';
import { generateInvoiceJournalEntry } from '@/lib/accounting-service';
import { logAudit } from '@/lib/audit-service';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================
// GET /api/invoices/[id] - Get invoice with third party info and journal entry
// ============================================================
export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

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
      return error('Factura no encontrada', 404);
    }

    // Compute days overdue
    let daysOverdue = 0;
    if (invoice.dueDate && invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && Number(invoice.balanceDue) > 0) {
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
      return error('Factura no encontrada', 404);
    }

    // PROTECCIÓN DE PERIODO (Fecha Original)
    const periodOpen = await ensurePeriodOpen(existing.companyId, existing.issueDate);
    if (!periodOpen) {
      return error('No se puede editar una factura en un periodo contable cerrado', 403);
    }

    // Validate status if provided
    const validStatuses = ['PENDING', 'PARTIAL', 'PAID', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return error('El estado debe ser PENDING, PARTIAL, PAID o CANCELLED');
    }

    const { lines, totalAmount, subtotal, taxAmount } = body;
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const roleError = ensureNotViewer(user!);
    if (roleError) return roleError;

    const result = await db.$transaction(async (tx) => {
      // 1. Delete old lines if lines are provided
      if (lines) {
        await tx.invoiceLine.deleteMany({ where: { invoiceId: id } });
        await tx.taxEntry.deleteMany({ where: { invoiceId: id } });
      }

      // 2. Build update data
      const updateData: any = {};
      if (status !== undefined) updateData.status = status;
      if (balanceDue !== undefined) updateData.balanceDue = balanceDue;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (totalAmount !== undefined) updateData.totalAmount = totalAmount;
      if (subtotal !== undefined) updateData.subtotal = subtotal;
      if (taxAmount !== undefined) updateData.taxAmount = taxAmount;

      // 3. Update main record
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: updateData,
      });

      // 4. Create new lines if provided
      if (lines && Array.isArray(lines)) {
        for (const line of lines) {
          await tx.invoiceLine.create({
            data: {
              invoiceId: id,
              lineNumber: line.lineNumber,
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              unit: line.unit || 'PIEZA',
              subtotal: line.subtotal,
              discountRate: line.discountRate || 0,
              accountId: line.accountId,
              costCenterId: line.costCenterId,
            },
          });
        }
      }

      // 5. Regenerar Asiento Contable Automático
      try {
        await generateInvoiceJournalEntry(tx as any, id, user!.id);
      } catch (accErr) {
        console.error('Error regenerando contabilidad:', accErr);
      }

      return updatedInvoice;
    });

    return success(result);
  } catch (err: unknown) {
    console.error('Error updating invoice:', err);
    return serverError('Error al actualizar la factura');
  }
}

// DELETE /api/invoices/[id] - Delete and its journal entry
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await validateAuth(_request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const roleError = ensureNotViewer(user!);
    if (roleError) return roleError;

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: { journalEntry: true }
    });

    if (!invoice) return error('Factura no encontrada', 404);

    // Permitir eliminar si es PENDING o DRAFT
    if (String(invoice.status) !== 'PENDING' && String(invoice.status) !== 'DRAFT') {
      return error(`Solo facturas PENDING o DRAFT pueden ser eliminadas. Estado actual: ${invoice.status}`);
    }

    await db.$transaction(async (tx) => {
      // Registrar auditoría ANTES de borrar
      await logAudit({
        companyId: invoice.companyId,
        userId: user!.id,
        action: 'DELETE',
        entityType: 'Invoice',
        entityId: invoice.id,
        entityLabel: `Factura ${invoice.number}`,
        oldValues: invoice
      });

      // Si tiene póliza, la manejamos
      if (invoice.journalEntryId) {
        await tx.invoice.update({
          where: { id: id },
          data: { journalEntryId: null }
        });
        
        if (invoice.journalEntry?.status === 'DRAFT') {
          await tx.journalEntryLine.deleteMany({ where: { journalEntryId: invoice.journalEntryId } });
          await tx.journalEntry.delete({ where: { id: invoice.journalEntryId } });
        }
      }

      // Limpieza profunda (Cascade manual)
      await tx.invoiceLine.deleteMany({ where: { invoiceId: id } });
      await tx.taxEntry.deleteMany({ where: { invoiceId: id } });
      await tx.paymentSchedule.deleteMany({ where: { invoiceId: id } });
      
      await tx.invoice.delete({ where: { id } });
    });

    return success({ deleted: true, id });
  } catch (err) {
    console.error('Error deleting invoice:', err);
    return serverError('Error al eliminar la factura');
  }
}
