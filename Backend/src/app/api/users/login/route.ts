import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';
import { loginSchema } from '@/lib/schemas/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Validar con Zod (100/100 best practice)
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return error(result.error.issues[0].message);
    }
    const { password } = result.data;
    const email = result.data.email.toLowerCase().trim();

    // 2. Buscar usuario
    const user = await db.user.findFirst({ 
      where: { email: { equals: email } as any, isActive: true },
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

    // 3. Verificar contraseña
    let passwordMatches = false;
    try {
      passwordMatches = await bcrypt.compare(password, (user as any).passwordHash);
    } catch (e) {
      passwordMatches = false;
    }

    if (!passwordMatches) {
      return error('Credenciales inválidas');
    }

    // 4. Generar Token Seguro (HMAC SHA256)
    // Usamos crypto para firmar el token y evitar suplantación
    const crypto = await import('crypto');
    const secret = process.env.NEXTAUTH_SECRET || 'ganesha_super_secret_123';
    const payload = JSON.stringify({ userId: user.id, exp: Date.now() + (1000 * 60 * 60 * 24 * 7) }); // 7 días
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const token = Buffer.from(`${payload}.${signature}`).toString('base64');

    // 5. Send cookie (100/100 Hardening)
    const response = success({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        availableCompanies: user.memberships.map(m => ({
          id: m.companyId,
          name: m.company.name,
          role: m.role
        })),
        lastLoginAt: new Date(),
      }
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (err) {
    console.error('[POST /api/users/login]', err);
    return serverError('Error en el proceso de inicio de sesión');
  }
}
