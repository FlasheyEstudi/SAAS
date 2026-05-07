import { success, created, error, serverError, validateAuth, requireAuth, ensureNotViewer, parsePagination } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';
import { logAudit } from '@/lib/audit-service';
import { db } from '@/lib/db';

// ============================================================
// GET /api/bank-accounts - List bank accounts for a company
// Filters: companyId (required), isActive
// Includes count of movements and reconciled/pending counts
// ============================================================
export async function GET(request: Request) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);

    const companyId = searchParams.get('companyId');
    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    const isActiveParam = searchParams.get('isActive');

    const where: Prisma.BankAccountWhereInput = { companyId };
    if (isActiveParam !== null) {
      where.isActive = isActiveParam === 'true';
    }

    const [bankAccounts, total] = await Promise.all([
      db.bankAccount.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
          _count: {
            select: { movements: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.bankAccount.count({ where }),
    ]);

    // Enrich with reconciled/pending counts
    const bankAccountIds = bankAccounts.map((ba) => ba.id);
    const movementStatusCounts = bankAccountIds.length > 0
      ? await db.bankMovement.groupBy({
          by: ['bankAccountId', 'status'],
          where: { bankAccountId: { in: bankAccountIds } },
          _count: { id: true },
        })
      : [];

    const enrichedAccounts = bankAccounts.map((ba) => {
      const statusCounts = movementStatusCounts.filter((m) => m.bankAccountId === ba.id);
      const reconciled = statusCounts.find((m) => m.status === 'RECONCILED')?._count.id ?? 0;
      const pending = statusCounts.find((m) => m.status === 'PENDING')?._count.id ?? 0;
      const excluded = statusCounts.find((m) => m.status === 'EXCLUDED')?._count.id ?? 0;

      return {
        ...ba,
        movementCounts: {
          total: ba._count.movements,
          reconciled,
          pending,
          excluded,
        },
      };
    });

    return success({
      data: enrichedAccounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    console.error('Error listing bank accounts:', err);
    return serverError('Error al listar cuentas bancarias');
  }
}

// ============================================================
// POST /api/bank-accounts - Create a new bank account
// Required: companyId, bankName, accountNumber
// Optional: accountType, currency (default "MXN"), initialBalance
// ============================================================
export async function POST(request: Request) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const roleError = ensureNotViewer(user!);
    if (roleError) return roleError;

    const body = await request.json();
    const { companyId, bankName, accountNumber, accountType, currency, initialBalance } = body;

    // Validate required fields
    if (!companyId) return error('El companyId es obligatorio');
    if (!bankName || typeof bankName !== 'string' || bankName.trim().length === 0) {
      return error('El nombre del banco es obligatorio');
    }
    if (!accountNumber || typeof accountNumber !== 'string' || accountNumber.trim().length === 0) {
      return error('El número de cuenta es obligatorio');
    }

    // Validate accountType if provided
    const validTypes = ['CHECKING', 'SAVINGS', 'INVESTMENT'];
    if (accountType && !validTypes.includes(accountType)) {
      return error('El tipo de cuenta debe ser CHECKING, SAVINGS o INVESTMENT');
    }

    // Check company exists
    const company = await db.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return error('La empresa no existe');
    }

    // Check account number uniqueness per company
    const existing = await db.bankAccount.findFirst({
      where: { companyId, accountNumber: accountNumber.trim() },
    });
    if (existing) {
      return error('Ya existe una cuenta bancaria con ese número para esta empresa');
    }

    const bankAccount = await db.bankAccount.create({
      data: {
        companyId,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountType: accountType || 'CHECKING',
        currency: currency || 'MXN',
        initialBalance: initialBalance || 0,
        currentBalance: initialBalance || 0,
      },
      include: {
        company: { select: { id: true, name: true } },
      },
    });

    // Audit Log
    await logAudit({
      companyId: bankAccount.companyId,
      userId: user!.id,
      action: 'CREATE',
      entityType: 'BankAccount',
      entityId: bankAccount.id,
      entityLabel: `${bankAccount.bankName} - ${bankAccount.accountNumber}`,
      newValues: bankAccount,
    });

    return created(bankAccount);
  } catch (err: unknown) {
    console.error('Error creating bank account:', err);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return error('Ya existe una cuenta bancaria con ese número para esta empresa');
    }
    return serverError('Error al crear la cuenta bancaria');
  }
}

