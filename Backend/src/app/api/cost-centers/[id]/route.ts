import { db } from '@/lib/db';
import { success, notFound, error, serverError, validateAuth } from '@/lib/api-helpers';
import { logAudit } from '@/lib/audit-service';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================
// GET /api/cost-centers/[id] - Get cost center with children
// ============================================================
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const costCenter = await db.costCenter.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, name: true },
        },
        parent: {
          select: { id: true, code: true, name: true },
        },
        children: {
          include: {
            children: {
              include: {
                children: true, // 3 levels deep
              },
            },
          },
        },
        _count: {
          select: {
            journalLines: true,
            children: true,
          },
        },
      },
    });

    if (!costCenter) {
      return notFound('Centro de costo no encontrado');
    }

    return success(costCenter);
  } catch (err) {
    console.error('Error fetching cost center:', err);
    return serverError('Error al obtener el centro de costo');
  }
}

// ============================================================
// PUT /api/cost-centers/[id] - Update cost center
// Only name and isActive can be changed.
// ============================================================
export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await validateAuth(request);
    const { id } = await context.params;
    const body = await request.json();
    const { name, isActive } = body;

    // Check for immutable fields (code is now mutable)
    const immutableFields = ['companyId', 'parentId', 'level'];
    for (const field of immutableFields) {
      if (body[field] !== undefined) {
        return error(`El campo "${field}" no puede ser modificado después de la creación`);
      }
    }

    // Check cost center exists
    const existing = await db.costCenter.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Centro de costo no encontrado');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.code !== undefined) {
      const newCode = String(body.code).trim();
      if (newCode.length === 0) return error('El código no puede estar vacío');
      
      // If code is changing, check uniqueness
      if (newCode !== existing.code) {
        const duplicate = await db.costCenter.findFirst({
          where: { companyId: existing.companyId, code: newCode },
          select: { id: true }
        });
        if (duplicate) return error(`Ya existe otro centro con el código "${newCode}"`);
        updateData.code = newCode;
      }
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return error('El nombre del centro de costo no puede estar vacío');
      }
      updateData.name = name.trim();
    }
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return error('isActive debe ser un valor booleano');
      }
      updateData.isActive = isActive;
    }

    const costCenter = await db.costCenter.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { journalLines: true, children: true },
        },
      },
    });

    // Audit Log
    await logAudit({
      companyId: costCenter.companyId,
      userId: user?.id || null,
      action: 'UPDATE',
      entityType: 'COST_CENTER',
      entityId: costCenter.id,
      entityLabel: `${costCenter.code} - ${costCenter.name}`,
      oldValues: existing,
      newValues: costCenter,
    });

    return success(costCenter);
  } catch (err) {
    console.error('Error updating cost center:', err);
    return serverError('Error al actualizar el centro de costo');
  }
}

// ============================================================
// DELETE /api/cost-centers/[id] - Delete cost center
// Only if no journal lines reference it AND no children.
// ============================================================
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await validateAuth(_request);
    const { id } = await context.params;

    const costCenter = await db.costCenter.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            journalLines: true,
            children: true,
          },
        },
      },
    });

    if (!costCenter) {
      return notFound('Centro de costo no encontrado');
    }

    if (costCenter._count.children > 0) {
      return error(`No se puede eliminar el centro de costo porque tiene ${costCenter._count.children} centro(s) hijo(s). Elimine los centros hijos primero.`);
    }

    if (costCenter._count.journalLines > 0) {
      return error(`No se puede eliminar el centro de costo porque tiene ${costCenter._count.journalLines} partida(s) contable(s) asociada(s).`);
    }

    // Audit Log
    await logAudit({
      companyId: costCenter.companyId,
      userId: user?.id || null,
      action: 'DELETE',
      entityType: 'COST_CENTER',
      entityId: costCenter.id,
      entityLabel: `${costCenter.code} - ${costCenter.name}`,
      oldValues: costCenter,
    });

    await db.costCenter.delete({ where: { id } });

    return success({ deleted: true, id });
  } catch (err) {
    console.error('Error deleting cost center:', err);
    return serverError('Error al eliminar el centro de costo');
  }
}
