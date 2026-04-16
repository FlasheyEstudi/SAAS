import { db } from '@/lib/db';
import { success, notFound, error, serverError } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================
// GET /api/tax/rates/[id] - Obtener tasa de impuesto por ID
// ============================================================
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const taxRate = await db.taxRate.findUnique({
      where: { id },
      include: {
        taxEntries: {
          select: { id: true },
        },
      },
    });

    if (!taxRate) {
      return notFound('Tasa de impuesto no encontrada');
    }

    return success({
      ...taxRate,
      taxEntriesCount: taxRate.taxEntries.length,
      taxEntries: undefined,
    });
  } catch (err) {
    console.error('Error al obtener tasa de impuesto:', err);
    return serverError('Error al obtener la tasa de impuesto');
  }
}

// ============================================================
// PUT /api/tax/rates/[id] - Actualizar tasa de impuesto
// ============================================================
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { taxType, rate, name, description, isRetention, isActive, effectiveFrom, effectiveTo } = body;

    // Verificar que la tasa existe
    const existing = await db.taxRate.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Tasa de impuesto no encontrada');
    }

    // Construir datos de actualización
    const updateData: Prisma.TaxRateUpdateInput = {};

    if (taxType !== undefined) {
      const validTypes = ['IVA', 'ISR', 'RET_IVA', 'RET_ISR', 'IEPS', 'CEDULAR'];
      if (!validTypes.includes(taxType)) {
        return error(`Tipo de impuesto inválido. Valores permitidos: ${validTypes.join(', ')}`);
      }
      updateData.taxType = taxType;
    }

    if (rate !== undefined) {
      if (rate < 0) {
        return error('La tasa (rate) debe ser mayor o igual a 0');
      }
      updateData.rate = parseFloat(rate);
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return error('El nombre no puede estar vacío');
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (isRetention !== undefined) {
      updateData.isRetention = isRetention;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (effectiveFrom !== undefined) {
      if (!effectiveFrom) {
        return error('La fecha de vigencia (effectiveFrom) es obligatoria');
      }
      updateData.effectiveFrom = new Date(effectiveFrom);
    }

    if (effectiveTo !== undefined) {
      updateData.effectiveTo = effectiveTo ? new Date(effectiveTo) : null;
    }

    const taxRate = await db.taxRate.update({
      where: { id },
      data: updateData,
    });

    return success(taxRate);
  } catch (err: unknown) {
    console.error('Error al actualizar tasa de impuesto:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return error('Ya existe una tasa con los mismos datos únicos');
      }
    }
    return serverError('Error al actualizar la tasa de impuesto');
  }
}

// ============================================================
// DELETE /api/tax/rates/[id] - Eliminar tasa de impuesto
// Solo permite eliminar si no tiene entradas de impuesto asociadas
// ============================================================
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const taxRate = await db.taxRate.findUnique({
      where: { id },
      include: {
        taxEntries: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!taxRate) {
      return notFound('Tasa de impuesto no encontrada');
    }

    // No permitir eliminar si tiene entradas de impuesto asociadas
    if (taxRate.taxEntries.length > 0) {
      return error('No se puede eliminar la tasa de impuesto. Tiene entradas de impuesto asociadas. Desactívela en su lugar.');
    }

    await db.taxRate.delete({ where: { id } });

    return success({ deleted: true, id });
  } catch (err) {
    console.error('Error al eliminar tasa de impuesto:', err);
    return serverError('Error al eliminar la tasa de impuesto');
  }
}
