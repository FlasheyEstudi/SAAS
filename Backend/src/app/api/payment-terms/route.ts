import { db } from '@/lib/db';
import { success, created, error, parsePagination, serverError } from '@/lib/api-helpers';
import type { PaginatedResponse } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

// ============================================================
// GET /api/payment-terms - Listar términos de pago con paginación y filtros
// Parámetros: companyId (requerido), isActive (opcional)
// ============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);

    const companyId = searchParams.get('companyId');
    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    const isActive = searchParams.get('isActive');

    // Construir cláusula WHERE
    const where: Prisma.PaymentTermWhereInput = { companyId };

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const [paymentTerms, total] = await Promise.all([
      db.paymentTerm.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.paymentTerm.count({ where }),
    ]);

    const result: PaginatedResponse<(typeof paymentTerms)[0]> = {
      data: paymentTerms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };

    return success(result);
  } catch (err) {
    console.error('Error al listar términos de pago:', err);
    return serverError('Error al listar términos de pago');
  }
}

// ============================================================
// POST /api/payment-terms - Crear un nuevo término de pago
// El código debe ser único por empresa (ej: NET-15, NET-30, COD)
// ============================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, code, name, days, description, isActive } = body;

    // Validar campos obligatorios
    if (!companyId) {
      return error('El companyId es obligatorio');
    }
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return error('El código del término de pago es obligatorio');
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return error('El nombre del término de pago es obligatorio');
    }
    if (days === undefined || days === null || typeof days !== 'number' || days < 0) {
      return error('Los días de crédito deben ser un número mayor o igual a 0');
    }

    // Verificar que la empresa existe
    const company = await db.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return error('La empresa especificada no existe');
    }

    // Verificar unicidad del código por empresa
    const existingCode = await db.paymentTerm.findUnique({
      where: { companyId_code: { companyId, code: code.trim().toUpperCase() } },
    });
    if (existingCode) {
      return error(`Ya existe un término de pago con el código "${code.trim().toUpperCase()}" en esta empresa`);
    }

    const paymentTerm = await db.paymentTerm.create({
      data: {
        companyId,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        days,
        description: description?.trim() || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return created(paymentTerm);
  } catch (err: unknown) {
    console.error('Error al crear término de pago:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return error('Ya existe un término de pago con ese código en la empresa');
      }
      if (err.code === 'P2003') {
        return error('La empresa especificada no existe');
      }
    }
    return serverError('Error al crear el término de pago');
  }
}
