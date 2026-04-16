import { db } from '@/lib/db';
import { success, created, error, parsePagination, serverError } from '@/lib/api-helpers';
import type { PaginatedResponse } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

// ============================================================
// GET /api/third-parties - List third parties with pagination & filters
// ============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);

    const companyId = searchParams.get('companyId');
    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    const type = searchParams.get('type') || '';
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search') || '';

    // Build where clause
    const where: Prisma.ThirdPartyWhereInput = { companyId };

    if (type && ['CUSTOMER', 'SUPPLIER', 'BOTH'].includes(type)) {
      where.type = type;
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { taxId: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [thirdParties, total] = await Promise.all([
      db.thirdParty.findMany({
        where,
        include: {
          _count: {
            select: { invoices: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.thirdParty.count({ where }),
    ]);

    const result: PaginatedResponse<(typeof thirdParties)[0]> = {
      data: thirdParties,
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
    console.error('Error listing third parties:', err);
    return serverError('Error al listar terceros');
  }
}

// ============================================================
// POST /api/third-parties - Create a new third party
// ============================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, name, type, taxId, email, phone, address, city, state, country } = body;

    // Validate required fields
    if (!companyId) {
      return error('El companyId es obligatorio');
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return error('El nombre del tercero es obligatorio');
    }

    // Validate type if provided
    const validTypes = ['CUSTOMER', 'SUPPLIER', 'BOTH'];
    const thirdPartyType = type || 'CUSTOMER';
    if (!validTypes.includes(thirdPartyType)) {
      return error('El tipo debe ser CUSTOMER, SUPPLIER o BOTH');
    }

    // Verify company exists
    const company = await db.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return error('La empresa especificada no existe');
    }

    const thirdParty = await db.thirdParty.create({
      data: {
        companyId,
        name: name.trim(),
        type: thirdPartyType,
        taxId: taxId?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        country: country?.trim() || null,
      },
      include: {
        _count: {
          select: { invoices: true },
        },
      },
    });

    return created(thirdParty);
  } catch (err: unknown) {
    console.error('Error creating third party:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        return error('La empresa especificada no existe');
      }
    }
    return serverError('Error al crear el tercero');
  }
}
