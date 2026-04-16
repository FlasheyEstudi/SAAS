import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

// ============================================================
// POST /api/reconciliation/auto-match - Conciliación automática por monto
//
// Cuerpo: {
//   bankAccountId (requerido),
//   tolerance (opcional, default 0.01 - tolerancia en monto),
//   maxDaysDiff (opcional, default 1 - días de diferencia máximos en fecha),
//   matchStrategy (opcional, "STRICT"|"LENIENT" - default "STRICT")
// }
//
// Diferencia con /advanced:
// - STRICT: requiere monto exacto (dentro de tolerancia) Y mismo día
// - LENIENT: permite monto dentro de tolerancia Y hasta N días de diferencia
//
// Aplica automáticamente las coincidencias encontradas.
// Retorna los pares conciliados y los movimientos que quedaron sin coincidencia.
// ============================================================

function roundTwo(n: number): number {
  return Math.round(n * 100) / 100;
}

interface AutoMatchBody {
  bankAccountId: string;
  tolerance?: number;
  maxDaysDiff?: number;
  matchStrategy?: 'STRICT' | 'LENIENT';
}

export async function POST(request: Request) {
  try {
    const body: AutoMatchBody = await request.json();
    const {
      bankAccountId,
      tolerance: rawTolerance,
      maxDaysDiff: rawMaxDaysDiff,
      matchStrategy = 'STRICT',
    } = body;

    if (!bankAccountId) {
      return error('El parámetro bankAccountId es obligatorio');
    }

    if (!['STRICT', 'LENIENT'].includes(matchStrategy)) {
      return error('matchStrategy debe ser STRICT o LENIENT');
    }

    const tolerance = rawTolerance !== undefined ? rawTolerance : 0.01;
    const maxDaysDiff = matchStrategy === 'STRICT' ? 0 : (rawMaxDaysDiff !== undefined ? rawMaxDaysDiff : 1);

    // Validar cuenta bancaria
    const bankAccount = await db.bankAccount.findUnique({
      where: { id: bankAccountId },
      include: { company: { select: { id: true } } },
    });

    if (!bankAccount) {
      return error('Cuenta bancaria no encontrada');
    }

    const companyId = bankAccount.company.id;

    // Obtener movimientos pendientes
    const pendingMovements = await db.bankMovement.findMany({
      where: { bankAccountId, status: 'PENDING' },
      orderBy: { movementDate: 'asc' },
    });

    if (pendingMovements.length === 0) {
      return success({
        bankAccountId,
        message: 'No hay movimientos pendientes para conciliar automáticamente',
        matched: [],
        unmatched: [],
        stats: { processed: 0, matched: 0, unmatched: 0 },
      });
    }

    // Obtener partidas contables ya vinculadas (para excluir)
    const existingLinks = await db.bankMovement.findMany({
      where: {
        bankAccountId,
        journalLineId: { not: null },
      },
      select: { journalLineId: true },
    });

    const usedLineIds = new Set(
      existingLinks
        .map((m) => m.journalLineId)
        .filter((id): id is string => id !== null)
    );

    // Obtener cuentas bancarias (ASSET tipo banco)
    const bankAssetAccounts = await db.account.findMany({
      where: {
        companyId,
        accountType: 'ASSET',
        isGroup: false,
        isActive: true,
        OR: [
          { code: { startsWith: '1.1' } },
          { name: { contains: 'Banco' } },
        ],
      },
      select: { id: true },
    });

    const assetAccountIds = bankAssetAccounts.map((a) => a.id);

    // Obtener partidas contables disponibles para conciliar
    const journalLines = assetAccountIds.length > 0
      ? await db.journalEntryLine.findMany({
          where: {
            accountId: { in: assetAccountIds },
            id: { notIn: Array.from(usedLineIds) },
            journalEntry: { status: 'POSTED' },
          },
          include: {
            journalEntry: {
              select: { entryNumber: true, entryDate: true, description: true },
            },
            account: { select: { code: true, name: true } },
          },
        })
      : [];

    // Emparejar y aplicar
    const matchedMovements: string[] = [];
    const matchedLines: string[] = [];
    const matchedPairs: Array<{
      bankMovementId: string;
      bankMovementDescription: string;
      bankMovementAmount: number;
      bankMovementDate: Date;
      journalLineId: string;
      journalEntryNumber: string;
      journalEntryDate: Date;
      amountDiff: number;
      daysDiff: number;
    }> = [];

    // Filtrar movimientos no coincididos
    const unmatchedMovements = [...pendingMovements];

    for (let i = 0; i < pendingMovements.length; i++) {
      const movement = pendingMovements[i];

      for (const line of journalLines) {
        // Ignorar partidas ya emparejadas en esta ejecución
        if (matchedLines.includes(line.id)) continue;

        // Determinar monto de la partida según tipo de movimiento bancario
        const lineAmount = movement.movementType === 'CREDIT' ? line.credit : line.debit;
        if (lineAmount <= 0) continue;

        // Verificar monto con tolerancia
        const amountDiff = Math.abs(roundTwo(movement.amount - lineAmount));
        if (amountDiff > tolerance) continue;

        // Verificar fecha
        const moveDate = new Date(movement.movementDate);
        const entryDate = new Date(line.journalEntry.entryDate);
        const diffMs = Math.abs(moveDate.getTime() - entryDate.getTime());
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays > maxDaysDiff) continue;

        // ¡Emparejado! Registrar y marcar
        matchedMovements.push(movement.id);
        matchedLines.push(line.id);
        matchedPairs.push({
          bankMovementId: movement.id,
          bankMovementDescription: movement.description,
          bankMovementAmount: movement.amount,
          bankMovementDate: movement.movementDate,
          journalLineId: line.id,
          journalEntryNumber: line.journalEntry.entryNumber,
          journalEntryDate: line.journalEntry.entryDate,
          amountDiff: roundTwo(amountDiff),
          daysDiff: Math.round(diffDays),
        });

        // Remover de no coincididos
        const idx = unmatchedMovements.findIndex((m) => m.id === movement.id);
        if (idx >= 0) unmatchedMovements.splice(idx, 1);

        break; // Cada movimiento solo empareja una vez
      }
    }

    // Aplicar coincidencias en la base de datos
    if (matchedPairs.length > 0) {
      await db.$transaction(
        matchedPairs.map((pair) =>
          db.bankMovement.update({
            where: { id: pair.bankMovementId },
            data: {
              status: 'RECONCILED',
              journalLineId: pair.journalLineId,
            },
          })
        )
      );
    }

    const matchedTotal = roundTwo(matchedPairs.reduce((sum, p) => sum + p.bankMovementAmount, 0));
    const unmatchedTotal = roundTwo(unmatchedMovements.reduce((sum, m) => sum + m.amount, 0));

    return success({
      bankAccountId,
      bankName: bankAccount.bankName,
      matchStrategy,
      parameters: { tolerance, maxDaysDiff },
      matched: matchedPairs,
      unmatched: unmatchedMovements.map((m) => ({
        id: m.id,
        description: m.description,
        movementDate: m.movementDate,
        amount: m.amount,
        movementType: m.movementType,
        reference: m.reference,
      })),
      stats: {
        processed: pendingMovements.length,
        matched: matchedPairs.length,
        unmatched: unmatchedMovements.length,
        matchRate: Math.round((matchedPairs.length / pendingMovements.length) * 100),
        matchedAmount: matchedTotal,
        unmatchedAmount: unmatchedTotal,
        totalAmount: roundTwo(matchedTotal + unmatchedTotal),
      },
    });
  } catch (err) {
    console.error('Error en conciliación automática:', err);
    return serverError('Error al ejecutar la conciliación automática');
  }
}
