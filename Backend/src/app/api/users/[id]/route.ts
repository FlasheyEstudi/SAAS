import { db } from '@/lib/db';
import { success, notFound, error, serverError } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await db.user.findUnique({
      where: { id },
      select: { id: true, companyId: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true, updatedAt: true },
    });
    if (!user) return notFound('Usuario no encontrado');
    return success(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    return serverError('Error al obtener usuario');
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name, email, role, isActive } = body;

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) return notFound('Usuario no encontrado');

    if (email && email !== existing.email) {
      const duplicate = await db.user.findFirst({ where: { companyId: existing.companyId, email } });
      if (duplicate) return error('Ya existe un usuario con ese email');
    }

    const validRoles = ['ADMIN', 'ACCOUNTANT', 'USER'];
    const user = await db.user.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(role !== undefined && validRoles.includes(role) ? { role } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      select: { id: true, companyId: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true, updatedAt: true },
    });
    return success(user);
  } catch (err) {
    console.error('Error updating user:', err);
    return serverError('Error al actualizar usuario');
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await db.user.findUnique({ where: { id } });
    if (!user) return notFound('Usuario no encontrado');

    await db.user.update({ where: { id }, data: { isActive: false } });
    return success({ deleted: true, id });
  } catch (err) {
    console.error('Error deleting user:', err);
    return serverError('Error al eliminar usuario');
  }
}
