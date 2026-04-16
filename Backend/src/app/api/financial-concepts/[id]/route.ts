import { db } from '@/lib/db';
import { success, notFound, error, serverError } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

type RouteContext = { params: Promise<{ id: string }> };

// Categorías válidas para conceptos financieros
const VALID_CATEGORIES = ['NOMINA', 'SERVICIO', 'IMPUESTO', 'ANTICIPO', 'TRASPASO', 'AJUSTE', 'OTRO'];

// ============================================================
// GET /api/financial-concepts/[id] - Obtener concepto financiero por ID
// Incluye las relaciones a Account y CostCenter
// ============================================================
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const concept = await db.financialConcept.findUnique({
      where: { id },
      include: {
        account: true,
        costCenter: true,
      },
    });

    if (!concept) {
      return notFound('Concepto financiero no encontrado');
    }

    return success(concept);
  } catch (err) {
    console.error('Error al obtener concepto financiero:', err);
    return serverError('Error al obtener el concepto financiero');
  }
}

// ============================================================
// PUT /api/financial-concepts/[id] - Actualizar concepto financiero
// Permite modificar todos los campos excepto companyId
// ============================================================
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { code, name, category, defaultAccountId, defaultCostCenterId, isActive } = body;

    // Verificar que existe
    const existing = await db.financialConcept.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Concepto financiero no encontrado');
    }

    // Si se cambia el código, verificar unicidad
    if (code && code.trim().length > 0 && code.trim().toUpperCase() !== existing.code) {
      const existingCode = await db.financialConcept.findUnique({
        where: { companyId_code: { companyId: existing.companyId, code: code.trim().toUpperCase() } },
      });
      if (existingCode) {
        return error(`Ya existe un concepto financiero con el código "${code.trim().toUpperCase()}" en esta empresa`);
      }
    }

    // Validar categoría si se proporciona
    if (category && !VALID_CATEGORIES.includes(category)) {
      return error(`Categoría inválida. Las categorías válidas son: ${VALID_CATEGORIES.join(', ')}`);
    }

    // Verificar que la cuenta contable existe (si se proporciona y es diferente)
    if (defaultAccountId !== undefined && defaultAccountId !== null && defaultAccountId !== existing.defaultAccountId) {
      const account = await db.account.findUnique({ where: { id: defaultAccountId } });
      if (!account) {
        return error('La cuenta contable por defecto especificada no existe');
      }
    }

    // Verificar que el centro de costo existe (si se proporciona y es diferente)
    if (defaultCostCenterId !== undefined && defaultCostCenterId !== null && defaultCostCenterId !== existing.defaultCostCenterId) {
      const costCenter = await db.costCenter.findUnique({ where: { id: defaultCostCenterId } });
      if (!costCenter) {
        return error('El centro de costo por defecto especificado no existe');
      }
    }

    const concept = await db.financialConcept.update({
      where: { id },
      data: {
        ...(code !== undefined && code.trim().length > 0 ? { code: code.trim().toUpperCase() } : {}),
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(defaultAccountId !== undefined ? { defaultAccountId: defaultAccountId || null } : {}),
        ...(defaultCostCenterId !== undefined ? { defaultCostCenterId: defaultCostCenterId || null } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
      include: {
        account: true,
        costCenter: true,
      },
    });

    return success(concept);
  } catch (err: unknown) {
    console.error('Error al actualizar concepto financiero:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return error('Ya existe un concepto financiero con ese código en la empresa');
      }
      if (err.code === 'P2003') {
        return error('La cuenta contable o centro de costo especificado no existe');
      }
    }
    return serverError('Error al actualizar el concepto financiero');
  }
}

// ============================================================
// DELETE /api/financial-concepts/[id] - Eliminar concepto financiero
// Los conceptos financieros son catálogo y no tienen dependencias
// fuertes, pero se elimina con precaución
// ============================================================
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const concept = await db.financialConcept.findUnique({ where: { id } });

    if (!concept) {
      return notFound('Concepto financiero no encontrado');
    }

    await db.financialConcept.delete({ where: { id } });

    return success({ deleted: true, id });
  } catch (err) {
    console.error('Error al eliminar concepto financiero:', err);
    return serverError('Error al eliminar el concepto financiero');
  }
}
