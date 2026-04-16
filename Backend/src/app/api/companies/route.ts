import { db } from '@/lib/db';
import { success, created, error, parsePagination, serverError } from '@/lib/api-helpers';
import type { PaginatedResponse } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

// ============================================================
// GET /api/companies - List all companies with pagination & search
// ============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);
    const search = searchParams.get('search') || '';

    const where: Prisma.CompanyWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { taxId: { contains: search } },
      ];
    }

    const [companies, total] = await Promise.all([
      db.company.findMany({
        where,
        include: {
          _count: {
            select: {
              accountingPeriods: true,
              accounts: true,
              journalEntries: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.company.count({ where }),
    ]);

    const result: PaginatedResponse<typeof companies[0]> = {
      data: companies,
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
    console.error('Error listing companies:', err);
    return serverError('Error al listar empresas');
  }
}

// ============================================================
// POST /api/companies - Create a new company
// ============================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, taxId, logoUrl, address, phone, email, currency } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return error('El nombre de la empresa es obligatorio');
    }
    if (!taxId || typeof taxId !== 'string' || taxId.trim().length === 0) {
      return error('El RFC/identificación fiscal es obligatorio');
    }

    const trimmedName = name.trim();
    const trimmedTaxId = taxId.trim();

    // Check name uniqueness
    const existing = await db.company.findFirst({
      where: { name: trimmedName },
    });
    if (existing) {
      return error('Ya existe una empresa con ese nombre');
    }

    const company = await db.company.create({
      data: {
        name: trimmedName,
        taxId: trimmedTaxId,
        logoUrl: logoUrl || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        currency: currency || 'MXN',
      },
      include: {
        _count: {
          select: {
            accountingPeriods: true,
            accounts: true,
            journalEntries: true,
          },
        },
      },
    });

    return created(company);
  } catch (err: unknown) {
    console.error('Error creating company:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return error('Ya existe una empresa con ese nombre o RFC');
      }
    }
    return serverError('Error al crear la empresa');
  }
}
