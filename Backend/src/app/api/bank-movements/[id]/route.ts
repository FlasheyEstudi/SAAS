import { db } from '@/lib/db';
import { success, notFound, error, serverError } from '@/lib/api-helpers';

type RouteContext = { params: Promise<{ id: string }> };

// ============================================================
// GET /api/bank-movements/[id] - Get a single bank movement
// ============================================================
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const movement = await db.bankMovement.findUnique({
      where: { id },
      include: {
        bankAccount: {
          select: { id: true, bankName: true, accountNumber: true, currency: true },
        },
        journalLine: {
          include: {
            account: { select: { id: true, code: true, name: true } },
            journalEntry: {
              select: { id: true, entryNumber: true, description: true, entryDate: true, status: true },
            },
          },
        },
      },
    });

    if (!movement) {
      return notFound('Movimiento bancario no encontrado');
    }

    return success(movement);
  } catch (err) {
    console.error('Error fetching bank movement:', err);
    return serverError('Error al obtener el movimiento bancario');
  }
}

// ============================================================
// PUT /api/bank-movements/[id] - Update bank movement
// Allows status change to RECONCILED/EXCLUDED and field updates
// ============================================================
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { movementDate, description, amount, movementType, reference, status, journalLineId } = body;

    const existing = await db.bankMovement.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Movimiento bancario no encontrado');
    }

    // Validate status if provided
    const validStatuses = ['RECONCILED', 'PENDING', 'EXCLUDED'];
    if (status && !validStatuses.includes(status)) {
      return error('El estado debe ser RECONCILED, PENDING o EXCLUDED');
    }

    // Validate movementType if provided
    if (movementType && !['DEBIT', 'CREDIT'].includes(movementType)) {
      return error('El tipo de movimiento debe ser DEBIT o CREDIT');
    }

    // Validate amount if provided
    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return error('El monto debe ser un número mayor a cero');
    }

    const movement = await db.bankMovement.update({
      where: { id },
      data: {
        ...(movementDate !== undefined ? { movementDate: new Date(movementDate) } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
        ...(amount !== undefined ? { amount } : {}),
        ...(movementType !== undefined ? { movementType } : {}),
        ...(reference !== undefined ? { reference } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(journalLineId !== undefined ? { journalLineId } : {}),
      },
      include: {
        bankAccount: { select: { id: true, bankName: true, accountNumber: true } },
      },
    });

    return success(movement);
  } catch (err) {
    console.error('Error updating bank movement:', err);
    return serverError('Error al actualizar el movimiento bancario');
  }
}

// ============================================================
// DELETE /api/bank-movements/[id] - Delete only PENDING movements
// ============================================================
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const movement = await db.bankMovement.findUnique({ where: { id } });
    if (!movement) {
      return notFound('Movimiento bancario no encontrado');
    }

    if (movement.status !== 'PENDING') {
      return error('Solo se pueden eliminar movimientos en estado PENDING. Este movimiento está en estado ' + movement.status + '.');
    }

    await db.bankMovement.delete({ where: { id } });

    return success({ deleted: true, id });
  } catch (err) {
    console.error('Error deleting bank movement:', err);
    return serverError('Error al eliminar el movimiento bancario');
  }
}
