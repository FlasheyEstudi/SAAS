import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

// ============================================================
// POST /api/bank-movements/reconcile - Auto-reconcile movements
// Body: { bankAccountId: string }
// Logic: Match bank movements with journal entry lines by amount
// and date proximity (±3 days). Mark matched as RECONCILED,
// set journalLineId.
// ============================================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bankAccountId } = body;

    if (!bankAccountId) {
      return error('El bankAccountId es obligatorio');
    }

    // Verify bank account exists
    const bankAccount = await db.bankAccount.findUnique({ where: { id: bankAccountId } });
    if (!bankAccount) {
      return error('La cuenta bancaria no existe');
    }

    // Get PENDING bank movements
    const pendingMovements = await db.bankMovement.findMany({
      where: {
        bankAccountId,
        status: 'PENDING',
      },
    });

    if (pendingMovements.length === 0) {
      return success({
        reconciled: 0,
        pending: 0,
        message: 'No hay movimientos pendientes por conciliar.',
      });
    }

    // Get the company ID to find journal entries
    const companyId = bankAccount.companyId;

    // Get all journal lines from POSTED entries for this company
    // that could potentially match
    const journalLines = await db.journalEntryLine.findMany({
      where: {
        journalEntry: {
          companyId,
          status: 'POSTED',
        },
        bankMovements: { none: {} }, // Not already reconciled to any bank movement
      } as any,
      include: {
        journalEntry: {
          select: { entryDate: true, entryNumber: true, description: true },
        },
        account: {
          select: { id: true, code: true, name: true, accountType: true },
        },
      },
    }) as any[];

    // Reconciliation logic: match by amount and date proximity (±3 days)
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    let reconciledCount = 0;
    const matchedJournalLineIds = new Set<string>();

    for (const movement of pendingMovements) {
      const movementDate = new Date(movement.movementDate);
      const movementAmount = movement.amount;

      // For DEBIT bank movements, look for journal lines with credit amounts
      // For CREDIT bank movements, look for journal lines with debit amounts
      const targetField = movement.movementType === 'DEBIT' ? 'credit' : 'debit';

      // Find matching journal lines
      const matches = journalLines.filter((line) => {
        // Skip already matched lines
        if (matchedJournalLineIds.has(line.id)) return false;

        // Check amount matches
        const lineAmount = Number(line[targetField] || 0);
        const movAmount = Number(movementAmount || 0);
        
        if (Math.abs(lineAmount - movAmount) > 0.01) return false;

        // Check date proximity (±3 days)
        const lineDate = new Date(line.journalEntry.entryDate);
        const dateDiff = Math.abs(movementDate.getTime() - lineDate.getTime());
        return dateDiff <= THREE_DAYS_MS;
      });

      if (matches.length > 0) {
        // Take the closest date match
        const bestMatch = matches.reduce((best, current) => {
          const bestDiff = Math.abs(movementDate.getTime() - new Date(best.journalEntry.entryDate).getTime());
          const currentDiff = Math.abs(movementDate.getTime() - new Date(current.journalEntry.entryDate).getTime());
          return currentDiff < bestDiff ? current : best;
        });

        // Mark as reconciled
        await db.bankMovement.update({
          where: { id: movement.id },
          data: {
            status: 'RECONCILED',
            journalLineId: bestMatch.id,
          },
        });

        matchedJournalLineIds.add(bestMatch.id);
        reconciledCount++;
      }
    }

    const remainingPending = pendingMovements.length - reconciledCount;

    return success({
      reconciled: reconciledCount,
      pending: remainingPending,
      message: reconciledCount > 0
        ? `Se conciliaron ${reconciledCount} movimiento(s). ${remainingPending} movimiento(s) pendiente(s).`
        : 'No se encontraron coincidencias para los movimientos pendientes.',
    });
  } catch (err) {
    console.error('Error auto-reconciling movements:', err);
    return serverError('Error al conciliar movimientos bancarios');
  }
}
