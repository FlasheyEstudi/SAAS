import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

// ============================================================
// POST /api/reconciliation/advanced - Conciliación bancaria avanzada
//
// Cuerpo: {
//   bankAccountId (requerido),
//   tolerance (opcional, default 0.01),
//   maxDaysDiff (opcional, default 3),
//   movementIds? (opcional, array de IDs específicos a conciliar),
//   autoApply (opcional, default false - si true aplica las coincidencias)
// }
//
// Lógica:
// 1. Obtener movimientos bancarios PENDING (o los especificados)
// 2. Buscar partidas contables (JournalEntryLine) por monto y rango de fecha
// 3. Emparejar por monto (dentro de tolerancia) y fecha (dentro de N días)
// 4. Si autoApply=true, actualizar BankMovement.status a RECONCILED
//    y setear journalLineId
// 5. Devolver movimientos coincididos y no coincididos
// ============================================================

function roundTwo(n: number): number {
  return Math.round(n * 100) / 100;
}

interface AdvancedReconciliationBody {
  bankAccountId: string;
  tolerance?: number;
  maxDaysDiff?: number;
  movementIds?: string[];
  autoApply?: boolean;
}

export async function POST(request: Request) {
  try {
    const body: AdvancedReconciliationBody = await request.json();
    const {
      bankAccountId,
      tolerance: rawTolerance,
      maxDaysDiff: rawMaxDaysDiff,
      movementIds,
      autoApply = false,
    } = body;

    if (!bankAccountId) {
      return error('El parámetro bankAccountId es obligatorio');
    }

    const tolerance = rawTolerance !== undefined ? rawTolerance : 0.01;
    const maxDaysDiff = rawMaxDaysDiff !== undefined ? rawMaxDaysDiff : 3;

    // Validar que la cuenta bancaria existe
    const bankAccount = await db.bankAccount.findUnique({
      where: { id: bankAccountId },
      include: {
        company: { select: { id: true } },
      },
    });

    if (!bankAccount) {
      return error('Cuenta bancaria no encontrada');
    }

    // 1. Obtener movimientos bancarios a conciliar
    const movementsWhere: Record<string, unknown> = {
      bankAccountId,
      status: 'PENDING',
    };
    if (movementIds && movementIds.length > 0) {
      movementsWhere.id = { in: movementIds };
      // Permitir también movimientos que ya estén PENDING
      delete movementsWhere.status;
      movementsWhere.status = 'PENDING';
    }

    const pendingMovements = await db.bankMovement.findMany({
      where: movementsWhere,
      orderBy: { movementDate: 'asc' },
    });

    if (pendingMovements.length === 0) {
      return success({
        bankAccountId,
        bankName: bankAccount.bankName,
        message: 'No hay movimientos pendientes de conciliar',
        matched: [],
        unmatched: [],
        summary: {
          totalPending: 0,
          matchedCount: 0,
          unmatchedCount: 0,
          matchedAmount: 0,
          unmatchedAmount: 0,
        },
      });
    }

    // 2. Para cada movimiento, buscar partidas contables coincidentes
    const companyId = bankAccount.company.id;

    // Obtener todas las partidas de cuentas bancarias del mismo tipo
    // que no estén ya vinculadas a otro movimiento
    const existingLinkedLineIds = await db.bankMovement.findMany({
      where: {
        bankAccountId,
        journalLineId: { not: null },
        status: 'RECONCILED',
      },
      select: { journalLineId: true },
    });

    const linkedIds = new Set(
      existingLinkedLineIds
        .map((m) => m.journalLineId)
        .filter((id): id is string => id !== null)
    );

    // Obtener IDs de cuentas que son cuentas bancarias (tipo ASSET con código de banco)
    // Buscamos todas las cuentas del tipo ASSET que pertenezcan a la misma empresa
    const bankAccounts_accounts = await db.account.findMany({
      where: {
        companyId,
        accountType: 'ASSET',
        isGroup: false,
        isActive: true,
        OR: [
          { code: { contains: '1.1' } },   // Cuentas de efectivo/bancos
          { name: { contains: 'Banco' } },
          { name: { contains: 'BBVA' } },
          { name: { contains: 'Santander' } },
        ],
      },
      select: { id: true, code: true, name: true },
    });

    const bankAccountIds = bankAccounts_accounts.map((a) => a.id);

    // Obtener todas las partidas contables de cuentas bancarias
    const allJournalLines = bankAccountIds.length > 0
      ? await db.journalEntryLine.findMany({
          where: {
            accountId: { in: bankAccountIds },
            id: { notIn: Array.from(linkedIds) },
            journalEntry: { status: 'POSTED' },
          },
          include: {
            journalEntry: {
              select: {
                id: true,
                entryNumber: true,
                description: true,
                entryDate: true,
                periodId: true,
              },
            },
            account: {
              select: { id: true, code: true, name: true },
            },
          },
        })
      : [];

    // 3. Emparejar movimientos con partidas contables
    const matched: {
      bankMovement: {
        id: string;
        description: string;
        movementDate: Date;
        amount: number;
        movementType: string;
        reference: string | null;
      };
      journalLine: {
        id: string;
        description: string;
        debit: number;
        credit: number;
        entryDate: Date;
        entryNumber: string;
        accountCode: string;
        accountName: string;
      };
      daysDiff: number;
      amountDiff: number;
    }[] = [];

    const unmatched = pendingMovements.filter((movement) => {
      let found = false;

      for (const line of allJournalLines) {
        // Verificar que el monto coincida según el tipo de movimiento
        // DEBIT bancario = salida de dinero = cargo en la cuenta bancaria = debit
        // CREDIT bancario = entrada de dinero = abono en la cuenta bancaria = credit
        let lineAmount: number;
        if (movement.movementType === 'CREDIT') {
          lineAmount = line.credit; // Entrada de dinero = abono
        } else {
          lineAmount = line.debit; // Salida de dinero = cargo
        }

        if (lineAmount <= 0) continue;

        // Comparar montos con tolerancia
        const amountDiff = Math.abs(roundTwo(movement.amount - lineAmount));
        if (amountDiff > tolerance) continue;

        // Comparar fechas (dentro de N días)
        const movementDate = new Date(movement.movementDate);
        const entryDate = new Date(line.journalEntry.entryDate);
        const diffTime = Math.abs(movementDate.getTime() - entryDate.getTime());
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        if (diffDays > maxDaysDiff) continue;

        // ¡Coincidencia encontrada!
        matched.push({
          bankMovement: {
            id: movement.id,
            description: movement.description,
            movementDate: movement.movementDate,
            amount: movement.amount,
            movementType: movement.movementType,
            reference: movement.reference,
          },
          journalLine: {
            id: line.id,
            description: line.description,
            debit: line.debit,
            credit: line.credit,
            entryDate: line.journalEntry.entryDate,
            entryNumber: line.journalEntry.entryNumber,
            accountCode: line.account.code,
            accountName: line.account.name,
          },
          daysDiff: Math.round(diffDays),
          amountDiff: roundTwo(amountDiff),
        });

        // Marcar la partida como ya emparejada para no reutilizarla
        (line as { _matched?: boolean })._matched = true;
        found = true;
        break; // Un movimiento solo puede coincidir con una partida
      }

      return !found;
    });

    // 4. Si autoApply, actualizar los movimientos coincididos
    let appliedCount = 0;
    if (autoApply && matched.length > 0) {
      const updatePromises = matched.map((match) =>
        db.bankMovement.update({
          where: { id: match.bankMovement.id },
          data: {
            status: 'RECONCILED',
            journalLineId: match.journalLine.id,
          },
        })
      );
      await Promise.all(updatePromises);
      appliedCount = matched.length;
    }

    // Calcular totales
    const matchedAmount = roundTwo(matched.reduce((sum, m) => sum + m.bankMovement.amount, 0));
    const unmatchedAmount = roundTwo(unmatched.reduce((sum, m) => sum + m.amount, 0));

    return success({
      bankAccountId,
      bankName: bankAccount.bankName,
      parameters: {
        tolerance,
        maxDaysDiff,
        autoApply,
        totalPending: pendingMovements.length,
      },
      matched,
      unmatched: unmatched.map((m) => ({
        id: m.id,
        description: m.description,
        movementDate: m.movementDate,
        amount: m.amount,
        movementType: m.movementType,
        reference: m.reference,
      })),
      appliedCount,
      summary: {
        totalPending: pendingMovements.length,
        matchedCount: matched.length,
        unmatchedCount: unmatched.length,
        matchedAmount,
        unmatchedAmount,
        matchRate: pendingMovements.length > 0
          ? Math.round((matched.length / pendingMovements.length) * 100)
          : 0,
      },
    });
  } catch (err) {
    console.error('Error en conciliación avanzada:', err);
    return serverError('Error al ejecutar la conciliación bancaria avanzada');
  }
}
