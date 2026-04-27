import { db } from '@/lib/db';
import { success, notFound, error, serverError } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================
// GET /api/accounts/[id] - Get account with its children (recursive)
// ============================================================
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const account = await db.account.findUnique({
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
                children: true, // 3 levels deep for practical use
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

    if (!account) {
      return notFound('Cuenta no encontrada');
    }

    return success(account);
  } catch (err) {
    console.error('Error fetching account:', err);
    return serverError('Error al obtener la cuenta');
  }
}

// ============================================================
// PUT /api/accounts/[id] - Update account
// Only name, isActive, description can be changed.
// Cannot change code, type, or nature after creation.
// ============================================================
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name, isActive, description } = body;

    // Check account exists with counts
    const existing = await db.account.findUnique({ 
      where: { id },
      include: {
        _count: {
          select: { journalLines: true, children: true }
        }
      }
    });

    if (!existing) {
      return notFound('Cuenta no encontrada');
    }

    // Check for strictly immutable fields
    const strictlyImmutable = ['companyId', 'parentId', 'level'];
    for (const field of strictlyImmutable) {
      if (body[field] !== undefined) {
        return error(`El campo "${field}" no puede ser modificado después de la creación por integridad de la jerarquía`);
      }
    }

    const hasActivity = existing._count.journalLines > 0;

    // Build update data
    const updateData: Record<string, unknown> = {};
    
    // Code update (allowed)
    if (body.code !== undefined) {
      const newCode = String(body.code).trim();
      if (newCode.length === 0) return error('El código no puede estar vacío');
      if (newCode !== existing.code) {
        const duplicate = await db.account.findFirst({
          where: { companyId: existing.companyId, code: newCode },
          select: { id: true }
        });
        if (duplicate) return error(`Ya existe otra cuenta con el código "${newCode}"`);
        updateData.code = newCode;
      }
    }

    // accountType and nature update (allowed ONLY if no activity)
    if (body.accountType !== undefined && body.accountType !== existing.accountType) {
      if (hasActivity) return error('No se puede cambiar el tipo de cuenta porque ya tiene movimientos contables');
      updateData.accountType = body.accountType;
    }

    if (body.nature !== undefined && body.nature !== existing.nature) {
      if (hasActivity) return error('No se puede cambiar la naturaleza de la cuenta porque ya tiene movimientos contables');
      updateData.nature = body.nature;
    }

    // isGroup update (allowed ONLY if no activity)
    if (body.isGroup !== undefined && body.isGroup !== existing.isGroup) {
      if (body.isGroup === true && hasActivity) {
        return error('No se puede convertir en cuenta de grupo porque ya tiene movimientos contables');
      }
      updateData.isGroup = body.isGroup;
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return error('El nombre de la cuenta no puede estar vacío');
      }
      updateData.name = name.trim();
    }
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return error('isActive debe ser un valor booleano');
      }
      updateData.isActive = isActive;
    }
    if (description !== undefined) {
      updateData.description = description;
    }

    const account = await db.account.update({
      where: { id },
      data: updateData,
      include: {
        children: {
          select: { id: true, code: true, name: true },
        },
        _count: {
          select: { journalLines: true, children: true },
        },
      },
    });

    return success(account);
  } catch (err) {
    console.error('Error updating account:', err);
    return serverError('Error al actualizar la cuenta');
  }
}

// ============================================================
// DELETE /api/accounts/[id] - Delete account
// Only if no journal lines reference it AND no children.
// ============================================================
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const account = await db.account.findUnique({
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

    if (!account) {
      return notFound('Cuenta no encontrada');
    }

    if (account._count.children > 0) {
      return error(`No se puede eliminar la cuenta porque tiene ${account._count.children} cuenta(s) hija(s). Elimine las cuentas hijas primero.`);
    }

    if (account._count.journalLines > 0) {
      return error(`No se puede eliminar la cuenta porque tiene ${account._count.journalLines} partida(s) contable(s) asociada(s).`);
    }

    await db.account.delete({ where: { id } });

    return success({ deleted: true, id });
  } catch (err) {
    console.error('Error deleting account:', err);
    return serverError('Error al eliminar la cuenta');
  }
}
