import { db } from '@/lib/db';
import { success, created, error, parsePagination, serverError } from '@/lib/api-helpers';
import type { PaginatedResponse } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);
    const companyId = searchParams.get('companyId') || '';
    const role = searchParams.get('role') || '';
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search') || '';

    const where: Prisma.UserWhereInput = {};
    if (companyId) where.companyId = companyId;
    if (role) where.role = role;
    if (isActive !== null && isActive !== '') where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: { id: true, companyId: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true, updatedAt: true },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    const result: PaginatedResponse<typeof users[0]> = {
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    };
    return success(result);
  } catch (err) {
    console.error('Error listing users:', err);
    return serverError('Error al listar usuarios');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, name, email, password, role } = body;

    if (!companyId || !name || !email || !password) {
      return error('companyId, name, email y password son obligatorios');
    }

    const passwordHash = Buffer.from(password).toString('base64');
    const validRoles = ['ADMIN', 'ACCOUNTANT', 'USER'];
    const userRole = validRoles.includes(role) ? role : 'USER';

    const existing = await db.user.findFirst({ where: { companyId, email } });
    if (existing) return error('Ya existe un usuario con ese email en esta empresa');

    const user = await db.user.create({
      data: { companyId, name, email, passwordHash, role: userRole },
      select: { id: true, companyId: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
    });

    return created(user);
  } catch (err) {
    console.error('Error creating user:', err);
    return serverError('Error al crear usuario');
  }
}
