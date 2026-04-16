import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, companyId } = body;

    if (!email || !password || !companyId) {
      return error('email, password y companyId son obligatorios');
    }

    const user = await db.user.findFirst({ where: { companyId, email, isActive: true } });
    if (!user) return error('Credenciales inválidas');

    const passwordHash = Buffer.from(password).toString('base64');
    if (user.passwordHash !== passwordHash) {
      return error('Credenciales inválidas');
    }

    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    return success({
      user: {
        id: user.id,
        companyId: user.companyId,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: new Date(),
      },
      token,
    });
  } catch (err) {
    console.error('Error logging in:', err);
    return serverError('Error al iniciar sesión');
  }
}
