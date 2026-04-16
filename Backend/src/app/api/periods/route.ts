import { db } from '@/lib/db';
import { success, created, error, parsePagination, serverError } from '@/lib/api-helpers';
import type { PaginatedResponse } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

// ============================================================
// GET /api/periods - List periods with filters
// Filters: companyId, year, status
// Includes count of journal entries per period
// ============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);
    const companyId = searchParams.get('companyId') || '';
    const yearParam = searchParams.get('year');
    const status = searchParams.get('status') || '';

    const where: Prisma.AccountingPeriodWhereInput = {};

    if (companyId) {
      where.companyId = companyId;
    }
    if (yearParam) {
      const year = parseInt(yearParam, 10);
      if (!isNaN(year)) {
        where.year = year;
      }
    }
    if (status) {
      where.status = status;
    }

    const [periods, total] = await Promise.all([
      db.accountingPeriod.findMany({
        where,
        include: {
          company: {
            select: { id: true, name: true, taxId: true },
          },
          _count: {
            select: {
              journalEntries: true,
            },
          },
        },
        orderBy: {
          // Default sort: year desc, month desc when sortBy is createdAt
          ...(sortBy === 'createdAt' || sortBy === 'updatedAt'
            ? { [sortBy]: sortOrder }
            : { year: sortOrder as 'asc' | 'desc', month: sortOrder as 'asc' | 'desc' }),
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.accountingPeriod.count({ where }),
    ]);

    const result: PaginatedResponse<typeof periods[0]> = {
      data: periods,
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
    console.error('Error listing periods:', err);
    return serverError('Error al listar períodos contables');
  }
}

// ============================================================
// POST /api/periods - Create a new accounting period
// Required: companyId, year (2020-2030), month (1-12)
// Optional: status (default "OPEN")
// Validates no duplicate company+year+month
// ============================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, year, month, status } = body;

    // Validate required fields
    if (!companyId || typeof companyId !== 'string') {
      return error('El ID de la empresa es obligatorio');
    }
    if (year === undefined || typeof year !== 'number') {
      return error('El año es obligatorio');
    }
    if (month === undefined || typeof month !== 'number') {
      return error('El mes es obligatorio');
    }

    // Validate year range
    if (year < 2020 || year > 2030) {
      return error('El año debe estar entre 2020 y 2030');
    }

    // Validate month range
    if (month < 1 || month > 12) {
      return error('El mes debe estar entre 1 y 12');
    }

    // Validate status if provided
    const validStatuses = ['OPEN', 'CLOSED', 'LOCKED'];
    if (status && !validStatuses.includes(status)) {
      return error(`El estado debe ser uno de: ${validStatuses.join(', ')}`);
    }

    // Verify company exists
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true },
    });
    if (!company) {
      return error('La empresa especificada no existe');
    }

    // Check for duplicate period
    const existing = await db.accountingPeriod.findUnique({
      where: {
        companyId_year_month: { companyId, year, month },
      },
    });
    if (existing) {
      return error(`Ya existe un período para ${company.name} en ${year}-${String(month).padStart(2, '0')}`);
    }

    const period = await db.accountingPeriod.create({
      data: {
        companyId,
        year,
        month,
        status: status || 'OPEN',
      },
      include: {
        company: {
          select: { id: true, name: true, taxId: true },
        },
        _count: {
          select: { journalEntries: true },
        },
      },
    });

    return created(period);
  } catch (err: unknown) {
    console.error('Error creating period:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return error('Ya existe un período con la misma combinación de empresa, año y mes');
      }
    }
    return serverError('Error al crear el período contable');
  }
}
