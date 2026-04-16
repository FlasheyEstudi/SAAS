import { db } from '@/lib/db';
import { success, created, notFound, error, serverError } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================
// GET /api/invoices/[id]/tax-entries - Listar entradas de impuesto de una factura
// ============================================================
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Verificar que la factura existe
    const invoice = await db.invoice.findUnique({
      where: { id },
      select: { id: true, companyId: true },
    });
    if (!invoice) {
      return notFound('Factura no encontrada');
    }

    const taxEntries = await db.taxEntry.findMany({
      where: { invoiceId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        taxRate: {
          select: {
            id: true,
            name: true,
            taxType: true,
            rate: true,
            isRetention: true,
          },
        },
      },
    });

    return success(taxEntries);
  } catch (err) {
    console.error('Error al listar entradas de impuesto:', err);
    return serverError('Error al listar las entradas de impuesto de la factura');
  }
}

// ============================================================
// POST /api/invoices/[id]/tax-entries - Agregar entrada de impuesto
// Auto-actualiza invoice.taxAmount con la suma de todos los impuestos
// ============================================================
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { taxRateId, taxableBase, taxAmount, withholdingAmount, isRetention } = body;

    // Validar campos obligatorios
    if (!taxRateId) {
      return error('El taxRateId es obligatorio');
    }
    if (taxableBase === undefined || taxableBase === null || taxableBase < 0) {
      return error('La base gravable es obligatoria y debe ser mayor o igual a 0');
    }
    if (taxAmount === undefined || taxAmount === null || taxAmount < 0) {
      return error('El monto del impuesto es obligatorio y debe ser mayor o igual a 0');
    }

    // Verificar que la factura existe
    const invoice = await db.invoice.findUnique({
      where: { id },
      select: { id: true, companyId: true, subtotal: true },
    });
    if (!invoice) {
      return notFound('Factura no encontrada');
    }

    // Verificar que la tasa de impuesto existe y pertenece a la empresa
    const taxRate = await db.taxRate.findUnique({
      where: { id: taxRateId },
    });
    if (!taxRate) {
      return error('La tasa de impuesto especificada no existe');
    }

    // Calcular el monto del impuesto si no se proporciona
    const parsedTaxAmount = taxAmount !== undefined ? Number(taxAmount) : Math.round(taxableBase * taxRate.rate * 100) / 100;
    const parsedWithholding = Number(withholdingAmount || 0);
    const parsedIsRetention = isRetention === true || taxRate.isRetention === true;

    // Crear la entrada de impuesto y actualizar el total de impuestos de la factura
    const result = await db.$transaction(async (tx) => {
      const taxEntry = await tx.taxEntry.create({
        data: {
          companyId: invoice.companyId,
          invoiceId: id,
          taxRateId,
          taxType: taxRate.taxType,
          taxableBase: Number(taxableBase),
          taxAmount: parsedTaxAmount,
          withholdingAmount: parsedWithholding,
          isRetention: parsedIsRetention,
        },
        include: {
          taxRate: {
            select: {
              id: true,
              name: true,
              taxType: true,
              rate: true,
              isRetention: true,
            },
          },
        },
      });

      // Recalcular el total de impuestos de la factura
      // Solo sumar los que NO son retenciones (las retenciones se restan)
      const taxSummary = await tx.taxEntry.aggregate({
        where: { invoiceId: id },
        _sum: { taxAmount: true, withholdingAmount: true },
      });

      const totalTaxes = Math.round((taxSummary._sum.taxAmount || 0) * 100) / 100;

      // Actualizar la factura: taxAmount y totalAmount
      const newTotalAmount = Math.round((invoice.subtotal + totalTaxes) * 100) / 100;

      await tx.invoice.update({
        where: { id },
        data: {
          taxAmount: totalTaxes,
          totalAmount: newTotalAmount,
          balanceDue: newTotalAmount,
        },
      });

      return taxEntry;
    });

    return created(result);
  } catch (err: unknown) {
    console.error('Error al crear entrada de impuesto:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        return error('La tasa de impuesto especificada no existe');
      }
    }
    return serverError('Error al crear la entrada de impuesto de la factura');
  }
}
