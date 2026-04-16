import { db } from '@/lib/db';
import { success, notFound, error, serverError } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================
// POST /api/invoices/[id]/pay - Register a payment against an invoice
// Body: { amount: number, journalEntryId?: string, description?: string }
// ============================================================
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { amount, journalEntryId, description } = body;

    // Validate amount
    if (amount === undefined || amount === null || amount <= 0) {
      return error('El monto del pago debe ser mayor a 0');
    }

    // Get current invoice
    const invoice = await db.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return notFound('Factura no encontrada');
    }

    // Cannot pay a cancelled invoice
    if (invoice.status === 'CANCELLED') {
      return error('No se puede registrar un pago en una factura cancelada');
    }

    // Cannot pay a fully paid invoice
    if (invoice.status === 'PAID' || invoice.balanceDue <= 0) {
      return error('La factura ya está completamente pagada');
    }

    // Validate amount does not exceed balance due
    if (amount > invoice.balanceDue) {
      return error(
        `El monto del pago (${amount}) excede el saldo pendiente (${invoice.balanceDue})`
      );
    }

    // Verify journal entry exists if provided
    if (journalEntryId) {
      const je = await db.journalEntry.findUnique({ where: { id: journalEntryId } });
      if (!je) {
        return error('La póliza contable especificada no existe');
      }
    }

    // Calculate new balance
    const newBalanceDue = Math.round((invoice.balanceDue - amount) * 100) / 100;

    // Determine new status
    let newStatus: string;
    if (newBalanceDue <= 0) {
      newStatus = 'PAID';
    } else {
      newStatus = 'PARTIAL';
    }

    // Update invoice
    const updatedInvoice = await db.invoice.update({
      where: { id },
      data: {
        balanceDue: Math.max(0, newBalanceDue),
        status: newStatus,
        ...(journalEntryId ? { journalEntryId } : {}),
      },
      include: {
        thirdParty: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    return success({
      ...updatedInvoice,
      paymentInfo: {
        amount,
        previousBalanceDue: invoice.balanceDue,
        newBalanceDue: Math.max(0, newBalanceDue),
        statusChanged: invoice.status !== newStatus,
        previousStatus: invoice.status,
        newStatus,
        description: description || null,
      },
    });
  } catch (err) {
    console.error('Error processing invoice payment:', err);
    return serverError('Error al procesar el pago de la factura');
  }
}
