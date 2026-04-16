import { db } from '@/lib/db';
import { success, created, notFound, error, serverError } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Calcula el número de parcialidades basado en los días del término de pago.
 * - 0 días (contra entrega): 1 parcialidad
 * - 1-30 días: 1 parcialidad
 * - 31-60 días: 2 parcialidades
 * - 61-90 días: 3 parcialidades
 * - 91+ días: 4 parcialidades
 */
function getInstallmentCount(days: number): number {
  if (days <= 30) return 1;
  if (days <= 60) return 2;
  if (days <= 90) return 3;
  return 4;
}

// ============================================================
// GET /api/invoices/[id]/payment-schedule - Listar programa de pagos de una factura
// ============================================================
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Verificar que la factura existe
    const invoice = await db.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return notFound('Factura no encontrada');
    }

    const schedules = await db.paymentSchedule.findMany({
      where: { invoiceId: id },
      orderBy: { installmentNumber: 'asc' },
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

    // Calcular totales del programa de pagos
    const totalExpected = schedules.reduce((sum, s) => sum + s.expectedAmount, 0);
    const totalPaid = schedules.reduce((sum, s) => sum + s.paidAmount, 0);

    return success({
      schedules,
      summary: {
        totalInstallments: schedules.length,
        totalExpected: Math.round(totalExpected * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        remainingBalance: Math.round((totalExpected - totalPaid) * 100) / 100,
      },
    });
  } catch (err) {
    console.error('Error al listar programa de pagos:', err);
    return serverError('Error al listar el programa de pagos de la factura');
  }
}

// ============================================================
// POST /api/invoices/[id]/payment-schedule - Crear programa de pagos
// Genera parcialidades basadas en el término de pago.
// Si ya existe un programa, lo elimina y lo recrea.
// Body: { paymentTermId?: string, installments?: number }
// Si se proporciona paymentTermId, calcula parcialidades según los días.
// Si se proporciona installments, usa ese número directamente.
// ============================================================
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { paymentTermId, installments: explicitInstallments } = body;

    // Obtener la factura con sus relaciones
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        paymentTerm: {
          select: { id: true, code: true, name: true, days: true },
        },
      },
    });

    if (!invoice) {
      return notFound('Factura no encontrada');
    }

    // Determinar el término de pago a usar
    let paymentTerm = invoice.paymentTerm;
    if (paymentTermId) {
      paymentTerm = await db.paymentTerm.findUnique({
        where: { id: paymentTermId },
      });
      if (!paymentTerm) {
        return error('El término de pago especificado no existe');
      }
    }

    if (!paymentTerm) {
      return error('La factura no tiene un término de pago asignado. Proporcione paymentTermId.');
    }

    // Determinar número de parcialidades
    const installmentCount = explicitInstallments || getInstallmentCount(paymentTerm.days);

    if (installmentCount < 1 || installmentCount > 12) {
      return error('El número de parcialidades debe estar entre 1 y 12');
    }

    // Calcular el monto por parcialidad
    const amountPerInstallment = Math.round(
      (invoice.totalAmount / installmentCount) * 100
    ) / 100;

    // Calcular las fechas de vencimiento dividiendo los días del término
    const daysPerInstallment = Math.ceil(paymentTerm.days / installmentCount);
    const baseDate = invoice.issueDate || new Date();

    // Generar las fechas de cada parcialidad
    const installmentDates: Date[] = [];
    for (let i = 0; i < installmentCount; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setDate(dueDate.getDate() + daysPerInstallment * (i + 1));
      installmentDates.push(dueDate);
    }

    // Ajustar la última parcialidad para que el total sea exacto
    const lastInstallmentAmount = Math.round(
      (invoice.totalAmount - amountPerInstallment * (installmentCount - 1)) * 100
    ) / 100;

    // Crear el programa de pagos en una transacción
    const result = await db.$transaction(async (tx) => {
      // Eliminar programa de pagos existente si lo hay
      await tx.paymentSchedule.deleteMany({
        where: { invoiceId: id },
      });

      // Crear las nuevas parcialidades
      const schedules: Awaited<ReturnType<typeof tx.paymentSchedule.create>>[] = [];
      for (let i = 0; i < installmentCount; i++) {
        const schedule = await tx.paymentSchedule.create({
          data: {
            companyId: invoice.companyId,
            invoiceId: id,
            paymentTermId: paymentTerm.id,
            installmentNumber: i + 1,
            dueDate: installmentDates[i],
            expectedAmount: i === installmentCount - 1 ? lastInstallmentAmount : amountPerInstallment,
            paidAmount: 0,
            status: 'PENDING',
          },
          include: {
            paymentTerm: {
              select: { id: true, code: true, name: true, days: true },
            },
          },
        });
        schedules.push(schedule);
      }

      return schedules;
    });

    return created(result);
  } catch (err: unknown) {
    console.error('Error al crear programa de pagos:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        return error('El término de pago especificado no existe');
      }
    }
    return serverError('Error al crear el programa de pagos de la factura');
  }
}
