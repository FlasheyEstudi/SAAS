import { db } from '@/lib/db';
import { success, notFound, error, serverError } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

type RouteContext = { params: Promise<{ id: string; scheduleId: string }> };

// ============================================================
// GET /api/invoices/[id]/payment-schedule/[scheduleId] - Obtener una parcialidad
// ============================================================
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id, scheduleId } = await context.params;

    const schedule = await db.paymentSchedule.findFirst({
      where: { id: scheduleId, invoiceId: id },
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

    if (!schedule) {
      return notFound('Parcialidad no encontrada');
    }

    return success(schedule);
  } catch (err) {
    console.error('Error al obtener parcialidad:', err);
    return serverError('Error al obtener la parcialidad del programa de pagos');
  }
}

// ============================================================
// PUT /api/invoices/[id]/payment-schedule/[scheduleId] - Actualizar una parcialidad
// Solo se permite modificar la fecha de vencimiento y el monto esperado
// si la parcialidad aún no ha sido pagada.
// ============================================================
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id, scheduleId } = await context.params;
    const body = await request.json();
    const { dueDate, expectedAmount } = body;

    // Verificar que la parcialidad existe y pertenece a la factura
    const existing = await db.paymentSchedule.findFirst({
      where: { id: scheduleId, invoiceId: id },
    });

    if (!existing) {
      return notFound('Parcialidad no encontrada');
    }

    // No permitir modificar parcialidades ya pagadas
    if (existing.status === 'PAID') {
      return error('No se puede modificar una parcialidad que ya fue pagada');
    }

    // Validar campos si se proporcionan
    if (dueDate !== undefined && !dueDate) {
      return error('La fecha de vencimiento es obligatoria');
    }
    if (expectedAmount !== undefined && (expectedAmount === null || expectedAmount <= 0)) {
      return error('El monto esperado debe ser mayor a 0');
    }

    // Construir datos de actualización
    const updateData: Prisma.PaymentScheduleUpdateInput = {};

    if (dueDate !== undefined) {
      updateData.dueDate = new Date(dueDate);
    }
    if (expectedAmount !== undefined) {
      updateData.expectedAmount = Number(expectedAmount);
    }

    const schedule = await db.paymentSchedule.update({
      where: { id: scheduleId },
      data: updateData,
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

    return success(schedule);
  } catch (err) {
    console.error('Error al actualizar parcialidad:', err);
    return serverError('Error al actualizar la parcialidad del programa de pagos');
  }
}

// ============================================================
// DELETE /api/invoices/[id]/payment-schedule/[scheduleId] - Eliminar una parcialidad
// Solo se permite eliminar si aún no ha sido pagada.
// ============================================================
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id, scheduleId } = await context.params;

    // Verificar que la parcialidad existe y pertenece a la factura
    const existing = await db.paymentSchedule.findFirst({
      where: { id: scheduleId, invoiceId: id },
    });

    if (!existing) {
      return notFound('Parcialidad no encontrada');
    }

    // No permitir eliminar parcialidades ya pagadas
    if (existing.status === 'PAID') {
      return error('No se puede eliminar una parcialidad que ya fue pagada');
    }

    await db.paymentSchedule.delete({
      where: { id: scheduleId },
    });

    return success({ deleted: true, id: scheduleId });
  } catch (err) {
    console.error('Error al eliminar parcialidad:', err);
    return serverError('Error al eliminar la parcialidad del programa de pagos');
  }
}
