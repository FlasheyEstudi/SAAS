import { db } from '@/lib/db';
import { success, notFound, error, serverError, validateAuth, requireAuth, unauthorized } from '@/lib/api-helpers';
import { logAudit } from '@/lib/audit-service';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await validateAuth(_request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const { id } = await context.params;
    const targetUser = await db.user.findUnique({
      where: { id },
      select: { id: true, companyId: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true, updatedAt: true },
    });
    
    if (!targetUser) return notFound('Usuario no encontrado');
    
    // Solo puede ver usuarios de su propia empresa
    if (targetUser.companyId !== user!.companyId) {
      return unauthorized('No tienes permiso para ver este usuario');
    }

    return success(targetUser);
  } catch (err) {
    console.error('Error fetching user:', err);
    return serverError('Error al obtener usuario');
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const currentUser = await validateAuth(request);
    const authError = requireAuth(currentUser);
    if (authError) return authError;

    // BLOQUEO TOTAL PARA VISOR: No puede editar NADA, ni siquiera a sí mismo.
    if (currentUser!.role === 'VIEWER') {
      return unauthorized('El rol de Visor no tiene permisos para realizar ediciones');
    }

    const { id } = await context.params;
    const body = await request.json();
    const { name, email, role, isActive } = body;

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) return notFound('Usuario no encontrado');

    // Solo ADMIN puede editar otros usuarios. Otros roles (CONTADOR/GERENTE) solo a sí mismos.
    if (currentUser!.role !== 'ADMIN' && currentUser!.id !== id) {
      return unauthorized('No tienes permiso para editar este usuario');
    }

    if (existing.companyId !== currentUser!.companyId) {
      return unauthorized('El usuario pertenece a otra empresa');
    }

    if (email && email !== existing.email) {
      const duplicate = await db.user.findFirst({ where: { email: email.toLowerCase() } });
      if (duplicate) return error('Ya existe un usuario con ese email');
    }

    const validRoles = ['ADMIN', 'ACCOUNTANT', 'MANAGER', 'VIEWER'];
    const updatedUser = await db.user.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email: email.toLowerCase() } : {}),
        ...(role !== undefined && validRoles.includes(role) && currentUser!.role === 'ADMIN' ? { role } : {}),
        ...(isActive !== undefined && currentUser!.role === 'ADMIN' ? { isActive } : {}),
      },
      select: { id: true, companyId: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true, updatedAt: true },
    });

    await logAudit({
      companyId: currentUser!.companyId!,
      userId: currentUser!.id,
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      entityLabel: `Usuario: ${updatedUser.name}`,
      oldValues: existing,
      newValues: updatedUser
    });

    return success(updatedUser);
  } catch (err) {
    console.error('Error updating user:', err);
    return serverError('Error al actualizar usuario');
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const currentUser = await validateAuth(_request);
    const authError = requireAuth(currentUser);
    if (authError) return authError;

    // BLOQUEO TOTAL PARA VISOR
    if (currentUser!.role === 'VIEWER') {
      return unauthorized('El rol de Visor no tiene permisos para eliminar usuarios');
    }

    const { id } = await context.params;
    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) return notFound('Usuario no encontrado');

    if (currentUser!.role !== 'ADMIN' || existing.companyId !== currentUser!.companyId) {
      return unauthorized('Solo los administradores pueden eliminar usuarios de su empresa');
    }

    if (id === currentUser!.id) {
      return error('No puedes eliminarte a ti mismo');
    }

    await db.user.update({ where: { id }, data: { isActive: false } });
    
    await logAudit({
      companyId: currentUser!.companyId!,
      userId: currentUser!.id,
      action: 'DELETE',
      entityType: 'User',
      entityId: id,
      entityLabel: `Desactivar usuario: ${existing.name}`,
    });

    return success({ deleted: true, id });
  } catch (err) {
    console.error('Error deleting user:', err);
    return serverError('Error al eliminar usuario');
  }
}
