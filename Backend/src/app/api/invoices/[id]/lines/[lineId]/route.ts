import { db } from '@/lib/db';
import { success, notFound, error, serverError } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

type RouteContext = { params: Promise<{ id: string; lineId: string }> };

// ============================================================
// GET /api/invoices/[id]/lines/[lineId] - Obtener una línea específica
// ============================================================
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id, lineId } = await context.params;

    const line = await db.invoiceLine.findFirst({
      where: { id: lineId, invoiceId: id },
      include: {
        account: {
          select: { id: true, code: true, name: true },
        },
        costCenter: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!line) {
      return notFound('Línea de factura no encontrada');
    }

    return success(line);
  } catch (err) {
    console.error('Error al obtener línea de factura:', err);
    return serverError('Error al obtener la línea de la factura');
  }
}

// ============================================================
// PUT /api/invoices/[id]/lines/[lineId] - Actualizar una línea
// Recalcula subtotal de la línea y el subtotal de la factura
// ============================================================
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id, lineId } = await context.params;
    const body = await request.json();
    const {
      description,
      quantity,
      unitPrice,
      unit,
      discountRate,
      accountId,
      costCenterId,
    } = body;

    // Verificar que la línea existe y pertenece a la factura
    const existingLine = await db.invoiceLine.findFirst({
      where: { id: lineId, invoiceId: id },
    });

    if (!existingLine) {
      return notFound('Línea de factura no encontrada');
    }

    // Validar campos si se proporcionan
    if (description !== undefined && (typeof description !== 'string' || description.trim().length === 0)) {
      return error('La descripción de la línea no puede estar vacía');
    }
    if (quantity !== undefined && (quantity === null || quantity <= 0)) {
      return error('La cantidad debe ser mayor a 0');
    }
    if (unitPrice !== undefined && (unitPrice === null || unitPrice < 0)) {
      return error('El precio unitario debe ser mayor o igual a 0');
    }

    // Obtener la factura para conocer el taxAmount actual
    const invoice = await db.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return notFound('Factura no encontrada');
    }

    // Calcular nuevo subtotal de la línea
    const parsedQuantity = quantity !== undefined ? Number(quantity) : existingLine.quantity;
    const parsedUnitPrice = unitPrice !== undefined ? Number(unitPrice) : existingLine.unitPrice;
    const parsedDiscountRate = discountRate !== undefined ? Number(discountRate) : existingLine.discountRate;

    const newSubtotal = Math.round(
      parsedQuantity * parsedUnitPrice * (1 - parsedDiscountRate / 100) * 100
    ) / 100;

    // Actualizar usando transacción para recalcular totales de la factura
    const result = await db.$transaction(async (tx) => {
      // Actualizar la línea
      const updatedLine = await tx.invoiceLine.update({
        where: { id: lineId },
        data: {
          ...(description !== undefined ? { description: description.trim() } : {}),
          ...(quantity !== undefined ? { quantity: parsedQuantity } : {}),
          ...(unitPrice !== undefined ? { unitPrice: parsedUnitPrice } : {}),
          ...(unit !== undefined ? { unit } : {}),
          ...(discountRate !== undefined ? { discountRate: parsedDiscountRate } : {}),
          subtotal: newSubtotal,
          taxBase: newSubtotal, // La base gravable por defecto es el subtotal
          ...(accountId !== undefined ? { accountId: accountId || null } : {}),
          ...(costCenterId !== undefined ? { costCenterId: costCenterId || null } : {}),
        },
        include: {
          account: {
            select: { id: true, code: true, name: true },
          },
          costCenter: {
            select: { id: true, code: true, name: true },
          },
        },
      });

      // Recalcular el subtotal de la factura
      const linesSummary = await tx.invoiceLine.aggregate({
        where: { invoiceId: id },
        _sum: { subtotal: true },
      });

      const invoiceSubtotal = Math.round((linesSummary._sum.subtotal || 0) * 100) / 100;

      // Actualizar la factura con los nuevos totales
      await tx.invoice.update({
        where: { id },
        data: {
          subtotal: invoiceSubtotal,
          totalAmount: invoiceSubtotal + invoice.taxAmount,
          balanceDue: invoiceSubtotal + invoice.taxAmount,
        },
      });

      return updatedLine;
    });

    return success(result);
  } catch (err: unknown) {
    console.error('Error al actualizar línea de factura:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        return error('La cuenta contable o el centro de costo especificado no existe');
      }
    }
    return serverError('Error al actualizar la línea de la factura');
  }
}

// ============================================================
// DELETE /api/invoices/[id]/lines/[lineId] - Eliminar una línea
// Recalcula el subtotal de la factura después de eliminar
// ============================================================
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id, lineId } = await context.params;

    // Verificar que la línea existe y pertenece a la factura
    const existingLine = await db.invoiceLine.findFirst({
      where: { id: lineId, invoiceId: id },
    });

    if (!existingLine) {
      return notFound('Línea de factura no encontrada');
    }

    // Obtener la factura antes de eliminar
    const invoice = await db.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return notFound('Factura no encontrada');
    }

    // Eliminar la línea y recalcular totales en transacción
    await db.$transaction(async (tx) => {
      await tx.invoiceLine.delete({
        where: { id: lineId },
      });

      // Recalcular el subtotal de la factura
      const linesSummary = await tx.invoiceLine.aggregate({
        where: { invoiceId: id },
        _sum: { subtotal: true },
      });

      const invoiceSubtotal = Math.round((linesSummary._sum.subtotal || 0) * 100) / 100;

      // Actualizar la factura con los nuevos totales
      await tx.invoice.update({
        where: { id },
        data: {
          subtotal: invoiceSubtotal,
          totalAmount: invoiceSubtotal + invoice.taxAmount,
          balanceDue: invoiceSubtotal + invoice.taxAmount,
        },
      });
    });

    return success({ deleted: true, id: lineId });
  } catch (err) {
    console.error('Error al eliminar línea de factura:', err);
    return serverError('Error al eliminar la línea de la factura');
  }
}
