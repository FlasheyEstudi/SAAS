import { db } from '@/lib/db';
import { success, notFound, error, serverError } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================
// GET /api/tax/entries/[id] - Obtener entrada de impuesto por ID
// ============================================================
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const taxEntry = await db.taxEntry.findUnique({
      where: { id },
      include: {
        taxRate: {
          select: { id: true, name: true, rate: true, taxType: true, isRetention: true },
        },
        invoice: {
          select: {
            id: true,
            number: true,
            invoiceType: true,
            totalAmount: true,
            issueDate: true,
            thirdParty: {
              select: { id: true, name: true, taxId: true },
            },
          },
        },
      },
    });

    if (!taxEntry) {
      return notFound('Entrada de impuesto no encontrada');
    }

    return success(taxEntry);
  } catch (err) {
    console.error('Error al obtener entrada de impuesto:', err);
    return serverError('Error al obtener la entrada de impuesto');
  }
}

// ============================================================
// PUT /api/tax/entries/[id] - Actualizar entrada de impuesto
// ============================================================
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { taxRateId, taxType, taxableBase, taxAmount, withholdingAmount, isRetention } = body;

    // Verificar que la entrada existe
    const existing = await db.taxEntry.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Entrada de impuesto no encontrada');
    }

    // Construir datos de actualización
    const updateData: Prisma.TaxEntryUpdateInput = {};

    if (taxRateId !== undefined) {
      // Verificar que la tasa de impuesto existe
      const taxRate = await db.taxRate.findUnique({
        where: { id: taxRateId },
        select: { id: true, companyId: true, isActive: true },
      });
      if (!taxRate) {
        return error('La tasa de impuesto especificada no existe');
      }
      if (!taxRate.isActive) {
        return error('La tasa de impuesto está desactivada');
      }
      updateData.taxRate = { connect: { id: taxRateId } };
    }

    if (taxType !== undefined) {
      const validTypes = ['IVA', 'ISR', 'RET_IVA', 'RET_ISR', 'IEPS', 'CEDULAR'];
      if (!validTypes.includes(taxType)) {
        return error(`Tipo de impuesto inválido. Valores permitidos: ${validTypes.join(', ')}`);
      }
      updateData.taxType = taxType;
    }

    if (taxableBase !== undefined) {
      if (taxableBase < 0) {
        return error('La base gravable debe ser mayor o igual a 0');
      }
      updateData.taxableBase = parseFloat(taxableBase);
    }

    if (taxAmount !== undefined) {
      if (taxAmount < 0) {
        return error('El monto del impuesto debe ser mayor o igual a 0');
      }
      updateData.taxAmount = parseFloat(taxAmount);
    }

    if (withholdingAmount !== undefined) {
      if (withholdingAmount < 0) {
        return error('El monto retenido debe ser mayor o igual a 0');
      }
      updateData.withholdingAmount = parseFloat(withholdingAmount);
    }

    if (isRetention !== undefined) {
      updateData.isRetention = isRetention;
    }

    const taxEntry = await db.taxEntry.update({
      where: { id },
      data: updateData,
      include: {
        taxRate: {
          select: { id: true, name: true, rate: true, taxType: true },
        },
        invoice: {
          select: {
            id: true,
            number: true,
            invoiceType: true,
          },
        },
      },
    });

    return success(taxEntry);
  } catch (err: unknown) {
    console.error('Error al actualizar entrada de impuesto:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        return error('La tasa de impuesto especificada no existe');
      }
    }
    return serverError('Error al actualizar la entrada de impuesto');
  }
}

// ============================================================
// DELETE /api/tax/entries/[id] - Eliminar entrada de impuesto
// ============================================================
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const taxEntry = await db.taxEntry.findUnique({ where: { id } });
    if (!taxEntry) {
      return notFound('Entrada de impuesto no encontrada');
    }

    await db.taxEntry.delete({ where: { id } });

    return success({ deleted: true, id });
  } catch (err) {
    console.error('Error al eliminar entrada de impuesto:', err);
    return serverError('Error al eliminar la entrada de impuesto');
  }
}
