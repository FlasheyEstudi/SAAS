import { db } from '@/lib/db';
import { success, created, error, parsePagination, serverError } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

// ============================================================
// GET /api/bank-movements - List bank movements
// Filters: bankAccountId (required), status, movementType, dateFrom, dateTo
// ============================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, sortBy, sortOrder } = parsePagination(searchParams);

    const bankAccountId = searchParams.get('bankAccountId');
    if (!bankAccountId) {
      return error('El parámetro bankAccountId es obligatorio');
    }

    // Verify bank account exists
    const bankAccount = await db.bankAccount.findUnique({ where: { id: bankAccountId } });
    if (!bankAccount) {
      return error('La cuenta bancaria no existe');
    }

    const where: Prisma.BankMovementWhereInput = { bankAccountId };

    const status = searchParams.get('status');
    if (status && ['RECONCILED', 'PENDING', 'EXCLUDED'].includes(status)) {
      where.status = status;
    }

    const movementType = searchParams.get('movementType');
    if (movementType && ['DEBIT', 'CREDIT'].includes(movementType)) {
      where.movementType = movementType;
    }

    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    if (dateFrom || dateTo) {
      where.movementDate = {};
      if (dateFrom) {
        (where.movementDate as Prisma.DateTimeNullableFilter).gte = new Date(dateFrom);
      }
      if (dateTo) {
        (where.movementDate as Prisma.DateTimeNullableFilter).lte = new Date(dateTo);
      }
    }

    const [movements, total] = await Promise.all([
      db.bankMovement.findMany({
        where,
        include: {
          bankAccount: { select: { id: true, bankName: true, accountNumber: true } },
          journalLine: {
            include: {
              account: { select: { id: true, code: true, name: true } },
              journalEntry: { select: { id: true, entryNumber: true, description: true } },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.bankMovement.count({ where }),
    ]);

    return success({
      data: movements,
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
    console.error('Error listing bank movements:', err);
    return serverError('Error al listar movimientos bancarios');
  }
}

// ============================================================
// POST /api/bank-movements - Create a new bank movement
// Required: bankAccountId, movementDate, description, amount, movementType
// Optional: reference
// ============================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bankAccountId, movementDate, description, amount, movementType, reference } = body;

    // Validate required fields
    if (!bankAccountId) return error('El bankAccountId es obligatorio');
    if (!movementDate) return error('La fecha del movimiento es obligatoria');
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return error('La descripción del movimiento es obligatoria');
    }
    if (amount === undefined || amount === null || typeof amount !== 'number') {
      return error('El monto del movimiento es obligatorio y debe ser un número');
    }
    if (amount <= 0) {
      return error('El monto del movimiento debe ser mayor a cero');
    }
    if (!movementType || !['DEBIT', 'CREDIT'].includes(movementType)) {
      return error('El tipo de movimiento debe ser DEBIT o CREDIT');
    }

    // Verify bank account exists
    const bankAccount = await db.bankAccount.findUnique({ where: { id: bankAccountId } });
    if (!bankAccount) {
      return error('La cuenta bancaria no existe');
    }

    const movement = await db.bankMovement.create({
      data: {
        bankAccountId,
        movementDate: new Date(movementDate),
        description: description.trim(),
        amount,
        movementType,
        reference: reference || null,
      },
      include: {
        bankAccount: { select: { id: true, bankName: true, accountNumber: true } },
      },
    });

    return created(movement);
  } catch (err) {
    console.error('Error creating bank movement:', err);
    return serverError('Error al crear el movimiento bancario');
  }
}
