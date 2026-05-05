import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, created, error, parsePagination, serverError, validateAuth, requireAuth, unauthorized } from '@/lib/api-helpers';
import type { PaginatedResponse } from '@/lib/api-helpers';
import bcrypt from 'bcryptjs';
import { logAudit, logAuditTx } from '@/lib/audit-service';

export async function GET(request: NextRequest) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const { searchParams } = request.nextUrl;
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);
    
    // Scoping to current company
    const companyId = searchParams.get('companyId') || user!.companyId;
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (role) where.role = role;
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: { 
          id: true, 
          companyId: true, 
          name: true, 
          email: true, 
          role: true, 
          isActive: true, 
          lastLoginAt: true, 
          createdAt: true, 
          updatedAt: true 
        },
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return success({
      users, // Mantener compatibilidad con el hook anterior
      data: users, // Estándar paginado
      pagination: { 
        page, 
        limit, 
        total, 
        totalPages: Math.ceil(total / limit), 
        hasNext: page * limit < total, 
        hasPrev: page > 1 
      },
    });
  } catch (err: any) {
    console.error('[GET /api/users] CRASH:', err.message);
    return serverError(`Error interno: ${err.message}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await validateAuth(request);
    const authError = requireAuth(currentUser);
    if (authError) return authError;

    // Solo ADMIN puede crear usuarios. VIEWER jamás puede crear nada.
    if (currentUser!.role !== 'ADMIN') {
      return unauthorized('No tienes permisos suficientes para crear empleados');
    }

    const body = await request.json();
    const { companyId, name, email, password, role } = body;

    const targetCompanyId = companyId || currentUser!.companyId;
    if (targetCompanyId !== currentUser!.companyId) {
      return unauthorized('No puedes crear usuarios para otras empresas');
    }

    if (!targetCompanyId || !name || !email || !password) {
      return error('Faltan campos obligatorios (nombre, email, contraseña)');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const validRoles = ['ADMIN', 'ACCOUNTANT', 'MANAGER', 'VIEWER'];
    const userRole = validRoles.includes(role) ? role : 'ACCOUNTANT';

    const existing = await db.user.findFirst({ 
      where: { email: email.toLowerCase().trim() } 
    });
    if (existing) return error('Ya existe un usuario con este correo electrónico');

    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { 
          companyId: targetCompanyId, 
          name, 
          email: email.toLowerCase().trim(), 
          passwordHash, 
          role: userRole as any 
        },
        select: { id: true, companyId: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      });

      await tx.userCompany.create({
        data: {
          userId: newUser.id,
          companyId: targetCompanyId,
          role: userRole === 'ADMIN' ? 'ADMIN' : (userRole as any),
        }
      });

      // USAR logAuditTx para evitar bloqueos (P2028) en transacciones SQLite concurrentes
      await logAuditTx(tx, {
        companyId: targetCompanyId,
        userId: currentUser!.id,
        action: 'CREATE',
        entityType: 'User',
        entityId: newUser.id,
        entityLabel: `Empleado: ${name} (${userRole})`,
        newValues: { name, email, role: userRole }
      });

      return newUser;
    }, {
      timeout: 10000
    });

    return created(user);
  } catch (err: any) {
    console.error('[POST /api/users] Internal Error:', err);
    return serverError(`Error al crear usuario: ${err.message}`);
  }
}
