import { db } from '@/lib/db';
import { success, notFound, error, serverError } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword) return error('newPassword es obligatorio');
    if (newPassword.length < 6) return error('La contraseña debe tener al menos 6 caracteres');

    const user = await db.user.findUnique({ where: { id } });
    if (!user) return notFound('Usuario no encontrado');

    const bcrypt = await import('bcryptjs');
    const newHash = await bcrypt.hash(newPassword, 10);
    
    await db.user.update({
      where: { id },
      data: { passwordHash: newHash }
    });

    return success({ message: 'Contraseña reiniciada correctamente' });
  } catch (err) {
    console.error('Error resetting password:', err);
    return serverError('Error al reiniciar contraseña');
  }
}
