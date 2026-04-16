import { db } from '@/lib/db';
import { success, notFound, serverError } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================
// POST /api/invoices/[id]/recalculate
// Recalcular totales de una factura:
// - subtotal = SUM(líneas.subtotal)
// - taxAmount = SUM(entradas de impuesto.taxAmount) - retenciones
// - totalAmount = subtotal + taxAmount
// - balanceDue = totalAmount - pagos registrados
// ============================================================
export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Verificar que la factura existe
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        paymentSchedules: {
          select: { paidAmount: true },
        },
      },
    });

    if (!invoice) {
      return notFound('Factura no encontrada');
    }

    // Calcular el subtotal de las líneas
    const linesSummary = await db.invoiceLine.aggregate({
      where: { invoiceId: id },
      _sum: { subtotal: true },
    });

    const newSubtotal = Math.round((linesSummary._sum.subtotal || 0) * 100) / 100;

    // Calcular el total de impuestos (solo los que no son retenciones)
    const taxSummary = await db.taxEntry.aggregate({
      where: { invoiceId: id },
      _sum: { taxAmount: true, withholdingAmount: true },
    });

    const newTaxAmount = Math.round((taxSummary._sum.taxAmount || 0) * 100) / 100;
    const totalWithholdings = Math.round((taxSummary._sum.withholdingAmount || 0) * 100) / 100;

    // Total con retenciones restadas
    const newTotalAmount = Math.round((newSubtotal + newTaxAmount - totalWithholdings) * 100) / 100;

    // Calcular pagos realizados (por programa de pagos o por balanceDue histórico)
    const schedulePaid = invoice.paymentSchedules.reduce(
      (sum, s) => sum + s.paidAmount, 0
    );
    const totalPaid = Math.round(schedulePaid * 100) / 100;

    // Balance = totalAmount - pagos realizados
    const newBalanceDue = Math.round((newTotalAmount - totalPaid) * 100) / 100;

    // Determinar el estado basado en el balance
    let newStatus = invoice.status;
    if (newBalanceDue <= 0.01) {
      newStatus = 'PAID';
    } else if (totalPaid > 0) {
      newStatus = 'PARTIAL';
    } else {
      newStatus = 'PENDING';
    }

    // Actualizar la factura
    const updatedInvoice = await db.invoice.update({
      where: { id },
      data: {
        subtotal: newSubtotal,
        taxAmount: newTaxAmount,
        totalAmount: newTotalAmount,
        balanceDue: Math.max(0, newBalanceDue),
        status: newStatus,
      },
    });

    return success({
      invoice: updatedInvoice,
      recalculation: {
        previousSubtotal: invoice.subtotal,
        newSubtotal,
        previousTaxAmount: invoice.taxAmount,
        newTaxAmount,
        previousTotalAmount: invoice.totalAmount,
        newTotalAmount,
        previousBalanceDue: invoice.balanceDue,
        newBalanceDue: Math.max(0, newBalanceDue),
        totalWithholdings,
        totalPaid,
        previousStatus: invoice.status,
        newStatus,
        statusChanged: invoice.status !== newStatus,
      },
    });
  } catch (err) {
    console.error('Error al recalcular factura:', err);
    return serverError('Error al recalcular los totales de la factura');
  }
}
