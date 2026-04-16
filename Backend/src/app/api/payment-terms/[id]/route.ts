import { db } from '@/lib/db';
import { success, notFound, error, serverError } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================
// GET /api/payment-terms/[id] - Obtener término de pago por ID
// ============================================================
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const paymentTerm = await db.paymentTerm.findUnique({
      where: { id },
      include: {
        _count: {
          select: { invoices: true, thirdParties: true, paymentSchedules: true },
        },
      },
    });

    if (!paymentTerm) {
      return notFound('Término de pago no encontrado');
    }

    return success(paymentTerm);
  } catch (err) {
    console.error('Error al obtener término de pago:', err);
    return serverError('Error al obtener el término de pago');
  }
}

// ============================================================
// PUT /api/payment-terms/[id] - Actualizar término de pago
// Permite modificar nombre, días, descripción y estado activo
// ============================================================
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { code, name, days, description, isActive } = body;

    // Verificar que existe
    const existing = await db.paymentTerm.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Término de pago no encontrado');
    }

    // Si se cambia el código, verificar unicidad
    if (code && code.trim().length > 0 && code.trim().toUpperCase() !== existing.code) {
      const existingCode = await db.paymentTerm.findUnique({
        where: { companyId_code: { companyId: existing.companyId, code: code.trim().toUpperCase() } },
      });
      if (existingCode) {
        return error(`Ya existe un término de pago con el código "${code.trim().toUpperCase()}" en esta empresa`);
      }
    }

    // Validar días si se proporcionan
    if (days !== undefined && (typeof days !== 'number' || days < 0)) {
      return error('Los días de crédito deben ser un número mayor o igual a 0');
    }

    const paymentTerm = await db.paymentTerm.update({
      where: { id },
      data: {
        ...(code !== undefined && code.trim().length > 0 ? { code: code.trim().toUpperCase() } : {}),
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(days !== undefined ? { days } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
      include: {
        _count: {
          select: { invoices: true, thirdParties: true, paymentSchedules: true },
        },
      },
    });

    return success(paymentTerm);
  } catch (err: unknown) {
    console.error('Error al actualizar término de pago:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return error('Ya existe un término de pago con ese código en la empresa');
      }
    }
    return serverError('Error al actualizar el término de pago');
  }
}

// ============================================================
// DELETE /api/payment-terms/[id] - Eliminar término de pago
// Solo se puede eliminar si no tiene facturas ni terceros asociados
// ============================================================
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const paymentTerm = await db.paymentTerm.findUnique({
      where: { id },
      include: {
        _count: {
          select: { invoices: true, thirdParties: true, paymentSchedules: true },
        },
      },
    });

    if (!paymentTerm) {
      return notFound('Término de pago no encontrado');
    }

    const { invoices, thirdParties, paymentSchedules } = paymentTerm._count;
    const relatedCount = invoices + thirdParties + paymentSchedules;

    if (relatedCount > 0) {
      const parts: string[] = [];
      if (invoices > 0) parts.push(`${invoices} factura(s)`);
      if (thirdParties > 0) parts.push(`${thirdParties} tercero(s)`);
      if (paymentSchedules > 0) parts.push(`${paymentSchedules} programa(s) de pago`);
      return error(`No se puede eliminar el término de pago. Tiene: ${parts.join(', ')}`);
    }

    await db.paymentTerm.delete({ where: { id } });

    return success({ deleted: true, id });
  } catch (err) {
    console.error('Error al eliminar término de pago:', err);
    return serverError('Error al eliminar el término de pago');
  }
}
