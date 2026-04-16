import { db } from '@/lib/db';
import { success, notFound, error, serverError } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

type RouteContext = { params: Promise<{ id: string; scheduleId: string }> };

// ============================================================
// POST /api/invoices/[id]/payment-schedule/[scheduleId]/pay
// Registrar pago de una parcialidad del programa de pagos.
// Actualiza paidAmount, status y opcionalmente journalEntryId.
// También actualiza el balanceDue de la factura.
// Body: { amount: number, journalEntryId?: string, description?: string }
// ============================================================
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id, scheduleId } = await context.params;
    const body = await request.json();
    const { amount, journalEntryId, description } = body;

    // Validar monto del pago
    if (amount === undefined || amount === null || amount <= 0) {
      return error('El monto del pago debe ser mayor a 0');
    }

    // Verificar que la factura existe
    const invoice = await db.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return notFound('Factura no encontrada');
    }

    // Verificar que la parcialidad existe y pertenece a la factura
    const schedule = await db.paymentSchedule.findFirst({
      where: { id: scheduleId, invoiceId: id },
    });

    if (!schedule) {
      return notFound('Parcialidad no encontrada');
    }

    // No permitir pagar parcialidades ya completamente pagadas
    if (schedule.status === 'PAID') {
      return error('Esta parcialidad ya está completamente pagada');
    }

    // Validar que el monto no exceda el saldo pendiente de la parcialidad
    const remainingOnSchedule = Math.round((schedule.expectedAmount - schedule.paidAmount) * 100) / 100;
    if (amount > remainingOnSchedule + 0.01) {
      return error(
        `El monto del pago (${amount}) excede el saldo pendiente de la parcialidad (${remainingOnSchedule})`
      );
    }

    // Validar que el monto no exceda el balanceDue de la factura
    if (amount > invoice.balanceDue + 0.01) {
      return error(
        `El monto del pago (${amount}) excede el saldo pendiente de la factura (${invoice.balanceDue})`
      );
    }

    // Verificar journal entry si se proporciona
    if (journalEntryId) {
      const je = await db.journalEntry.findUnique({ where: { id: journalEntryId } });
      if (!je) {
        return error('La póliza contable especificada no existe');
      }
    }

    // Calcular nuevo paidAmount de la parcialidad
    const newPaidAmount = Math.round((schedule.paidAmount + amount) * 100) / 100;

    // Determinar el nuevo estado de la parcialidad
    let newScheduleStatus: string;
    if (newPaidAmount >= schedule.expectedAmount - 0.01) {
      newScheduleStatus = 'PAID';
    } else {
      newScheduleStatus = 'PARTIAL';
    }

    // Ejecutar en transacción: actualizar parcialidad y factura
    const result = await db.$transaction(async (tx) => {
      // Actualizar la parcialidad
      const updatedSchedule = await tx.paymentSchedule.update({
        where: { id: scheduleId },
        data: {
          paidAmount: Math.min(newPaidAmount, schedule.expectedAmount),
          status: newScheduleStatus,
          paidDate: newScheduleStatus === 'PAID' ? new Date() : schedule.paidDate,
          ...(journalEntryId ? { journalEntryId } : {}),
        },
        include: {
          paymentTerm: {
            select: { id: true, code: true, name: true, days: true },
          },
          journalEntry: {
            select: {
              id: true,
              entryNumber: true,
              description: true,
              entryDate: true,
            },
          },
        },
      });

      // Recalcular balanceDue de la factura
      // Sumar todos los paidAmount de todas las parcialidades
      const paymentSummary = await tx.paymentSchedule.aggregate({
        where: { invoiceId: id },
        _sum: { paidAmount: true },
      });

      const totalPaidOnSchedule = Math.round((paymentSummary._sum.paidAmount || 0) * 100) / 100;
      const newBalanceDue = Math.round((invoice.totalAmount - totalPaidOnSchedule) * 100) / 100;

      // Determinar el nuevo estado de la factura
      let newInvoiceStatus: string;
      if (newBalanceDue <= 0.01) {
        newInvoiceStatus = 'PAID';
      } else if (totalPaidOnSchedule > 0) {
        newInvoiceStatus = 'PARTIAL';
      } else {
        newInvoiceStatus = 'PENDING';
      }

      // Actualizar la factura
      await tx.invoice.update({
        where: { id },
        data: {
          balanceDue: Math.max(0, newBalanceDue),
          status: newInvoiceStatus,
          ...(journalEntryId ? { journalEntryId } : {}),
        },
      });

      return updatedSchedule;
    });

    return success({
      ...result,
      paymentInfo: {
        amount,
        previousPaidAmount: schedule.paidAmount,
        newPaidAmount: Math.min(newPaidAmount, schedule.expectedAmount),
        statusChanged: schedule.status !== newScheduleStatus,
        previousStatus: schedule.status,
        newScheduleStatus,
        description: description || null,
      },
    });
  } catch (err) {
    console.error('Error al registrar pago de parcialidad:', err);
    return serverError('Error al registrar el pago de la parcialidad');
  }
}
