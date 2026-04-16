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

    // Check for immutable fields
    const immutableFields = ['code', 'accountType', 'nature', 'companyId', 'parentId', 'level', 'isGroup'];
    for (const field of immutableFields) {
      if (body[field] !== undefined) {
        return error(`El campo "${field}" no puede ser modificado después de la creación`);
      }
    }

    // Check account exists
    const existing = await db.account.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Cuenta no encontrada');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
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
