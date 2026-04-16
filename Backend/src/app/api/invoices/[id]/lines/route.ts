import { db } from '@/lib/db';
import { success, created, notFound, error, serverError } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================
// GET /api/invoices/[id]/lines - Listar todas las líneas de una factura
// ============================================================
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Verificar que la factura existe
    const invoice = await db.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return notFound('Factura no encontrada');
    }

    const lines = await db.invoiceLine.findMany({
      where: { invoiceId: id },
      orderBy: { lineNumber: 'asc' },
      include: {
        account: {
          select: { id: true, code: true, name: true },
        },
        costCenter: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    return success(lines);
  } catch (err) {
    console.error('Error al listar líneas de factura:', err);
    return serverError('Error al listar las líneas de la factura');
  }
}

// ============================================================
// POST /api/invoices/[id]/lines - Agregar una línea a una factura
// Auto-asigna lineNumber y recalcula el subtotal de la factura
// ============================================================
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
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

    // Validar campos obligatorios
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return error('La descripción de la línea es obligatoria');
    }
    if (quantity === undefined || quantity === null || quantity <= 0) {
      return error('La cantidad debe ser mayor a 0');
    }
    if (unitPrice === undefined || unitPrice === null || unitPrice < 0) {
      return error('El precio unitario debe ser mayor o igual a 0');
    }

    // Verificar que la factura existe
    const invoice = await db.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return notFound('Factura no encontrada');
    }

    // Valores por defecto
    const parsedQuantity = Number(quantity);
    const parsedUnitPrice = Number(unitPrice);
    const parsedDiscountRate = Number(discountRate || 0);

    // Calcular subtotal de la línea
    const subtotal = Math.round(
      parsedQuantity * parsedUnitPrice * (1 - parsedDiscountRate / 100) * 100
    ) / 100;

    // Buscar el siguiente lineNumber disponible
    const maxLine = await db.invoiceLine.findFirst({
      where: { invoiceId: id },
      orderBy: { lineNumber: 'desc' },
      select: { lineNumber: true },
    });
    const nextLineNumber = (maxLine?.lineNumber || 0) + 1;

    // Crear la línea usando transacción para recalcula el subtotal de la factura
    const result = await db.$transaction(async (tx) => {
      // Crear la nueva línea
      const line = await tx.invoiceLine.create({
        data: {
          invoiceId: id,
          lineNumber: nextLineNumber,
          description: description.trim(),
          quantity: parsedQuantity,
          unitPrice: parsedUnitPrice,
          unit: unit || 'PIEZA',
          discountRate: parsedDiscountRate,
          subtotal,
          taxBase: subtotal, // La base gravable por defecto es el subtotal
          accountId: accountId || null,
          costCenterId: costCenterId || null,
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

      // Recalcular el subtotal de la factura = SUM(lineas.subtotal)
      const linesSummary = await tx.invoiceLine.aggregate({
        where: { invoiceId: id },
        _sum: { subtotal: true, discountRate: true },
      });

      const newSubtotal = Math.round((linesSummary._sum.subtotal || 0) * 100) / 100;

      // Actualizar la factura
      await tx.invoice.update({
        where: { id },
        data: {
          subtotal: newSubtotal,
          totalAmount: newSubtotal + invoice.taxAmount,
          balanceDue: newSubtotal + invoice.taxAmount,
        },
      });

      return line;
    });

    return created(result);
  } catch (err: unknown) {
    console.error('Error al crear línea de factura:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        return error('La cuenta contable o el centro de costo especificado no existe');
      }
    }
    return serverError('Error al crear la línea de la factura');
  }
}
