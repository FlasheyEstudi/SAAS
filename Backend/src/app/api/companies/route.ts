import { db } from '@/lib/db';
import { success, created, error, parsePagination, serverError, validateAuth, requireAuth } from '@/lib/api-helpers';
import type { PaginatedResponse } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

// ============================================================
// GET /api/companies - List all companies with pagination & search
// ============================================================
export async function GET(request: Request) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);
    const search = searchParams.get('search') || '';

    const where: Prisma.CompanyWhereInput = {
      members: {
        some: { userId: user!.id }
      }
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search } },
            { taxId: { contains: search } },
          ]
        }
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
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const body = await request.json();
    const { name, taxId, logoUrl, address, phone, email, currency, parentId } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return error('El nombre de la empresa es obligatorio');
    }
    if (!taxId || typeof taxId !== 'string' || taxId.trim().length === 0) {
      return error('El RUC/identificación fiscal es obligatorio');
    }

    const trimmedName = name.trim();
    const trimmedTaxId = taxId.trim();

    // Check name uniqueness (allow branches with similar names but unique IDs)
    const existing = await db.company.findFirst({
      where: { name: trimmedName },
    });
    if (existing) {
      return error('Ya existe una empresa con ese nombre');
    }

    // Use a transaction to create the company and the membership link
    const company = await db.$transaction(async (tx) => {
      const newCompany = await tx.company.create({
        data: {
          name: trimmedName,
          taxId: trimmedTaxId,
          logoUrl: logoUrl || null,
          address: address || null,
          phone: phone || null,
          email: email || null,
          currency: currency || 'NIO',
          parentId: parentId || null,
        },
      });

      // Automatically link the creator as OWNER
      await tx.userCompany.create({
        data: {
          userId: user!.id,
          companyId: newCompany.id,
          role: 'OWNER',
        }
      });

      return newCompany;
    });

    return created(company);
  } catch (err: unknown) {
    console.error('Error creating company:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return error('Ya existe una empresa con ese nombre o RUC');
      }
    }
    return serverError('Error al crear la empresa');
  }
}
