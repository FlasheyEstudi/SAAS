import { db } from '@/lib/db';
import { success, created, error, parsePagination, serverError, validateAuth } from '@/lib/api-helpers';
import type { PaginatedResponse } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';
import { logAudit } from '@/lib/audit-service';

// ============================================================
// GET /api/cost-centers - List cost centers for a company
// Filters: companyId (required), isActive, search
// Returns flat list ordered by code
// ============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);
    const companyId = searchParams.get('companyId') || '';
    const isActiveParam = searchParams.get('isActive');
    const search = searchParams.get('search') || '';

    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    const where: Prisma.CostCenterWhereInput = { companyId };

    if (isActiveParam !== null && isActiveParam !== '') {
      where.isActive = isActiveParam === 'true';
    }

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
      ];
    }

    const [costCenters, total] = await Promise.all([
      db.costCenter.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          parentId: true,
          level: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              journalLines: true,
              children: true,
            },
          },
        },
        orderBy: { code: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.costCenter.count({ where }),
    ]);

    const result: PaginatedResponse<typeof costCenters[0]> = {
      data: costCenters,
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
    console.error('Error listing cost centers:', err);
    return serverError('Error al listar centros de costo');
  }
}

// ============================================================
// POST /api/cost-centers - Create a new cost center
// Required: companyId, code, name
// Optional: parentId
// Auto-calculates level based on parentId depth
// ============================================================
export async function POST(request: Request) {
  try {
    const user = await validateAuth(request);
    const body = await request.json();
    const { companyId, code, name, parentId } = body;

    // Validate required fields
    if (!companyId || typeof companyId !== 'string') {
      return error('El ID de la empresa es obligatorio');
    }
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return error('El código del centro de costo es obligatorio');
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return error('El nombre del centro de costo es obligatorio');
    }

    const trimmedCode = code.trim();
    const trimmedName = name.trim();

    // Verify company exists
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });
    if (!company) {
      return error('La empresa especificada no existe');
    }

    // If parentId provided, verify it exists and belongs to same company
    let level = 1;

    if (parentId) {
      const parent = await db.costCenter.findUnique({
        where: { id: parentId },
        select: { id: true, companyId: true, level: true },
      });
      if (!parent) {
        return error('El centro de costo padre especificado no existe');
      }
      if (parent.companyId !== companyId) {
        return error('El centro de costo padre debe pertenecer a la misma empresa');
      }
      level = parent.level + 1;
    }

    // Check code uniqueness per company
    const existing = await db.costCenter.findFirst({
      where: { companyId, code: trimmedCode },
    });
    if (existing) {
      return error(`Ya existe un centro de costo con el código "${trimmedCode}" en esta empresa`);
    }

    const costCenter = await db.costCenter.create({
      data: {
        companyId,
        code: trimmedCode,
        name: trimmedName,
        parentId: parentId || null,
        level,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            journalLines: true,
            children: true,
          },
        },
      },
    });

    // Audit Log
    await logAudit({
      companyId,
      userId: user?.id || null,
      action: 'CREATE',
      entityType: 'COST_CENTER',
      entityId: costCenter.id,
      entityLabel: `${costCenter.code} - ${costCenter.name}`,
      newValues: costCenter,
    });

    return created(costCenter);
  } catch (err: unknown) {
    console.error('Error creating cost center:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return error('Ya existe un centro de costo con ese código en esta empresa');
      }
    }
    return serverError('Error al crear el centro de costo');
  }
}
