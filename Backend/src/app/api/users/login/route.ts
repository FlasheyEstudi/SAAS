import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, companyId } = body;

    if (!email || !password) {
      return error('email y password son obligatorios');
    }

    const user = await db.user.findFirst({ 
      where: { email, isActive: true },
      include: {
        memberships: {
          include: {
            company: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!user) return error('Credenciales inválidas');

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
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
        availableCompanies: user.memberships.map(m => ({
          id: m.companyId,
          name: m.company.name,
          role: m.role
        })),
        lastLoginAt: new Date(),
      },
      token,
    });
  } catch (err) {
    console.error('Error logging in:', err);
    return serverError('Error al iniciar sesión');
  }
}
