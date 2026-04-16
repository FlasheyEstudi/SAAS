import { db } from '@/lib/db';
import { success, created, error, parsePagination, serverError } from '@/lib/api-helpers';
import type { PaginatedResponse } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

// ============================================================
// Validaciones de tipo y naturaleza contable
// accountType -> nature mapping (para validación en creación)
// ============================================================
const VALID_ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'] as const;
const VALID_NATURES = ['DEBITOR', 'ACREEDOR'] as const;
const ACCOUNT_TYPE_NATURE: Record<string, string> = {
  ASSET: 'DEBITOR',
  EXPENSE: 'DEBITOR',
  LIABILITY: 'ACREEDOR',
  EQUITY: 'ACREEDOR',
  INCOME: 'ACREEDOR',
};

// ============================================================
// GET /api/accounts - List accounts for a company (flat, ordered by code)
// Filters: companyId (required), accountType, isActive, search
// ============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);
    const companyId = searchParams.get('companyId') || '';
    const accountType = searchParams.get('accountType') || '';
    const isActiveParam = searchParams.get('isActive');
    const search = searchParams.get('search') || '';

    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    const where: Prisma.AccountWhereInput = { companyId };

    if (accountType && VALID_ACCOUNT_TYPES.includes(accountType as any)) {
      where.accountType = accountType;
    }

    if (isActiveParam !== null && isActiveParam !== '') {
      where.isActive = isActiveParam === 'true';
    }

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
      ];
    }

    const [accounts, total] = await Promise.all([
      db.account.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          parentId: true,
          accountType: true,
          nature: true,
          level: true,
          isGroup: true,
          isActive: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          children: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
        orderBy: { code: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.account.count({ where }),
    ]);

    const result: PaginatedResponse<typeof accounts[0]> = {
      data: accounts,
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
    console.error('Error listing accounts:', err);
    return serverError('Error al listar cuentas');
  }
}

// ============================================================
// POST /api/accounts - Create a new account
// Required: companyId, code, name, accountType, nature
// Optional: parentId, description
// Auto-calculates level based on parentId depth
// Validates code uniqueness per company
// ============================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, code, name, accountType, nature, parentId, description } = body;

    // Validate required fields
    if (!companyId || typeof companyId !== 'string') {
      return error('El ID de la empresa es obligatorio');
    }
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return error('El código de la cuenta es obligatorio');
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return error('El nombre de la cuenta es obligatorio');
    }
    if (!accountType || !VALID_ACCOUNT_TYPES.includes(accountType)) {
      return error(`El tipo de cuenta es obligatorio y debe ser uno de: ${VALID_ACCOUNT_TYPES.join(', ')}`);
    }
    if (!nature || !VALID_NATURES.includes(nature)) {
      return error(`La naturaleza es obligatoria y debe ser uno de: ${VALID_NATURES.join(', ')}`);
    }

    // Validate accountType-nature mapping
    const expectedNature = ACCOUNT_TYPE_NATURE[accountType];
    if (nature !== expectedNature) {
      return error(`La naturaleza "${nature}" no corresponde al tipo "${accountType}". Se espera "${expectedNature}".`);
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
    let isGroup = true; // By default, root accounts are groups

    if (parentId) {
      const parent = await db.account.findUnique({
        where: { id: parentId },
        select: { id: true, companyId: true, level: true, accountType: true },
      });
      if (!parent) {
        return error('La cuenta padre especificada no existe');
      }
      if (parent.companyId !== companyId) {
        return error('La cuenta padre debe pertenecer a la misma empresa');
      }
      level = parent.level + 1;

      // Validate that child account type matches parent
      if (parent.accountType !== accountType) {
        return error(`El tipo de cuenta debe coincidir con la cuenta padre. Padre: ${parent.accountType}, Hijo: ${accountType}`);
      }

      // If has a parent, it could be a leaf or a group (default to leaf for children)
      isGroup = false;
    }

    // Check code uniqueness per company
    const existing = await db.account.findFirst({
      where: { companyId, code: trimmedCode },
    });
    if (existing) {
      return error(`Ya existe una cuenta con el código "${trimmedCode}" en esta empresa`);
    }

    const account = await db.account.create({
      data: {
        companyId,
        code: trimmedCode,
        name: trimmedName,
        parentId: parentId || null,
        accountType,
        nature,
        level,
        isGroup,
        isActive: true,
        description: description || null,
      },
      include: {
        children: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return created(account);
  } catch (err: unknown) {
    console.error('Error creating account:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return error('Ya existe una cuenta con ese código en esta empresa');
      }
    }
    return serverError('Error al crear la cuenta');
  }
}
