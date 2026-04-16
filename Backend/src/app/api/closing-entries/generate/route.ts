import { db } from '@/lib/db';
import { success, error, created, serverError, generateEntryNumber } from '@/lib/api-helpers';

// ============================================================
// POST /api/closing-entries/generate - Generar asiento de cierre automáticamente
//
// Cuerpo: { companyId, periodId, closingType: "INCOME_EXPENSE"|"NET_INCOME", concept? }
//
// Lógica:
// 1. Validar que el período esté ABIERTO
// 2. Verificar que no exista ya un cierre del mismo tipo para el período
// 3. Calcular totales de ingresos (cuentas INCOME) y gastos (cuentas EXPENSE)
//    a partir de pólizas POSTED del período
// 4. Generar póliza DRAFT que cierra las cuentas de resultado
// 5. Crear registro ClosingEntry vinculado a la póliza
//
// Tipos de cierre:
// - INCOME_EXPENSE: Cierra cuentas de ingreso y gasto contra "Resultados del Ejercicio"
// - NET_INCOME: Cierra la cuenta "Resultados del Ejercicio" contra Capital
// ============================================================

function roundTwo(n: number): number {
  return Math.round(n * 100) / 100;
}

interface ClosingGenerateBody {
  companyId: string;
  periodId: string;
  closingType: 'INCOME_EXPENSE' | 'NET_INCOME';
  concept?: string;
}

export async function POST(request: Request) {
  try {
    const body: ClosingGenerateBody = await request.json();
    const { companyId, periodId, closingType, concept: customConcept } = body;

    // Validaciones de entrada
    if (!companyId || !periodId) {
      return error('Los parámetros companyId y periodId son obligatorios');
    }

    if (!closingType || !['INCOME_EXPENSE', 'NET_INCOME'].includes(closingType)) {
      return error('El closingType debe ser INCOME_EXPENSE o NET_INCOME');
    }

    // 1. Validar que el período exista y esté abierto
    const period = await db.accountingPeriod.findFirst({
      where: { id: periodId, companyId },
    });

    if (!period) {
      return error('Período contable no encontrado');
    }

    if (period.status !== 'OPEN') {
      return error(`El período ${period.year}-${String(period.month).padStart(2, '0')} está ${period.status}. Solo se pueden generar cierres en períodos ABIERTOS.`);
    }

    // 2. Verificar que no exista ya un cierre del mismo tipo para este período
    const existingClosing = await db.closingEntry.findFirst({
      where: { companyId, periodId, closingType },
    });

    if (existingClosing) {
      return error(`Ya existe un asiento de cierre tipo ${closingType} para este período (ID: ${existingClosing.id})`);
    }

    // 3. Calcular totales según el tipo de cierre
    if (closingType === 'INCOME_EXPENSE') {
      return await generateIncomeExpenseClosing(companyId, period, customConcept);
    } else {
      return await generateNetIncomeClosing(companyId, period, customConcept);
    }
  } catch (err) {
    console.error('Error al generar asiento de cierre:', err);
    return serverError('Error al generar el asiento de cierre');
  }
}

// ============================================================
// Cierre de Ingresos y Gastos a Resultados del Ejercicio
// - Salda todas las cuentas de INCOME (acreedoras) con cargo
// - Salda todas las cuentas de EXPENSE (deudoras) con abono
// - La contrapartida va a la cuenta "Resultados del Ejercicio" (EQUITY)
// ============================================================

async function generateIncomeExpenseClosing(
  companyId: string,
  period: { id: string; year: number; month: number },
  customConcept?: string
) {
  // Obtener cuentas de ingreso y gasto (solo cuentas hoja)
  const accounts = await db.account.findMany({
    where: {
      companyId,
      accountType: { in: ['INCOME', 'EXPENSE'] },
      isGroup: false,
      isActive: true,
    },
    select: { id: true, code: true, name: true, accountType: true },
  });

  if (accounts.length === 0) {
    return error('No se encontraron cuentas de ingreso o gasto para esta empresa');
  }

  const accountIds = accounts.map((a) => a.id);

  // Sumar débitos y créditos de partidas en pólizas POSTED del período
  const lineAggregates = await db.journalEntryLine.groupBy({
    by: ['accountId'],
    where: {
      accountId: { in: accountIds },
      journalEntry: {
        periodId: period.id,
        status: 'POSTED',
      },
    },
    _sum: {
      debit: true,
      credit: true,
    },
  });

  // Construir mapa de saldos por cuenta
  const balanceMap = new Map<string, { totalDebit: number; totalCredit: number }>();
  for (const agg of lineAggregates) {
    balanceMap.set(agg.accountId, {
      totalDebit: roundTwo(agg._sum.debit ?? 0),
      totalCredit: roundTwo(agg._sum.credit ?? 0),
    });
  }

  // Construir las partidas de cierre
  // INCOME: saldo = créditos - débitos → se cierra con cargo (debit)
  // EXPENSE: saldo = débitos - créditos → se cierra con abono (credit)
  const journalLines: { accountId: string; description: string; debit: number; credit: number }[] = [];
  let totalIncome = 0;
  let totalExpense = 0;

  for (const account of accounts) {
    const balance = balanceMap.get(account.id);
    if (!balance) continue; // Cuenta sin movimiento en el período

    if (account.accountType === 'INCOME') {
      // Saldo acreedor: credit - debit. Se cierra cargando esa diferencia
      const incomeBalance = roundTwo(balance.totalCredit - balance.totalDebit);
      if (incomeBalance > 0) {
        journalLines.push({
          accountId: account.id,
          description: `Cierre - ${account.name}`,
          debit: incomeBalance,
          credit: 0,
        });
        totalIncome += incomeBalance;
      }
    } else if (account.accountType === 'EXPENSE') {
      // Saldo deudor: debit - credit. Se cierra abonando esa diferencia
      const expenseBalance = roundTwo(balance.totalDebit - balance.totalCredit);
      if (expenseBalance > 0) {
        journalLines.push({
          accountId: account.id,
          description: `Cierre - ${account.name}`,
          debit: 0,
          credit: expenseBalance,
        });
        totalExpense += expenseBalance;
      }
    }
  }

  if (journalLines.length === 0) {
    return error('No hay movimientos de ingreso o gasto en pólizas POSTED para este período');
  }

  // Calcular resultado neto
  const netResult = roundTwo(totalIncome - totalExpense);

  // Buscar la cuenta de "Resultados del Ejercicio" (EQUITY)
  const resultAccount = await db.account.findFirst({
    where: {
      companyId,
      accountType: 'EQUITY',
      isGroup: false,
      isActive: true,
      OR: [
        { code: { contains: '3.0' } },
        { code: { contains: '35' } },
        { name: { contains: 'Resultado' } },
      ],
    },
    select: { id: true, code: true, name: true },
  });

  if (!resultAccount) {
    return error('No se encontró la cuenta de "Resultados del Ejercicio" (tipo EQUITY). Verifique el plan de cuentas.');
  }

  // Agregar la partida de contrapartida a Resultados del Ejercicio
  if (netResult > 0) {
    // Utilidad: se abona Resultados (porque se cargaron los ingresos)
    journalLines.push({
      accountId: resultAccount.id,
      description: `Cierre - Resultado del Ejercicio ${period.year}`,
      debit: 0,
      credit: roundTwo(netResult),
    });
  } else if (netResult < 0) {
    // Pérdida: se carga Resultados (porque se abonaron más gastos que ingresos)
    journalLines.push({
      accountId: resultAccount.id,
      description: `Cierre - Resultado del Ejercicio ${period.year}`,
      debit: roundTwo(Math.abs(netResult)),
      credit: 0,
    });
  }

  // Validar partida doble
  const totalDebit = roundTwo(journalLines.reduce((sum, l) => sum + l.debit, 0));
  const totalCredit = roundTwo(journalLines.reduce((sum, l) => sum + l.credit, 0));

  if (roundTwo(totalDebit - totalCredit) !== 0) {
    return error(`Error de partida doble: débitos (${totalDebit}) ≠ créditos (${totalCredit})`);
  }

  // Generar número de póliza secuencial
  const entryNumber = await generateEntryNumber(period.id, companyId);

  // 4. Crear la póliza de cierre y el registro ClosingEntry en transacción
  const concept = customConcept || `Cierre de Ingresos y Gastos - Período ${period.year}/${String(period.month).padStart(2, '0')}`;

  const result = await db.$transaction(async (tx) => {
    // Crear la póliza de cierre (DRAFT para revisión posterior)
    const journalEntry = await tx.journalEntry.create({
      data: {
        companyId,
        periodId: period.id,
        entryNumber,
        description: concept,
        entryDate: new Date(period.year, period.month, 0), // Último día del período
        entryType: 'DIARIO',
        status: 'DRAFT',
        totalDebit,
        totalCredit,
        difference: 0,
        lines: {
          create: journalLines,
        },
      },
      include: {
        lines: true,
      },
    });

    // Crear el registro ClosingEntry
    const closingEntry = await tx.closingEntry.create({
      data: {
        companyId,
        periodId: period.id,
        journalEntryId: journalEntry.id,
        closingType: 'INCOME_EXPENSE',
        concept,
        totalIncome,
        totalExpense,
        netResult,
      },
    });

    return { closingEntry, journalEntry };
  });

  return created({
    message: 'Asiento de cierre de ingresos y gastos generado exitosamente',
    closingEntry: result.closingEntry,
    journalEntry: {
      id: result.journalEntry.id,
      entryNumber: result.journalEntry.entryNumber,
      description: result.journalEntry.description,
      entryDate: result.journalEntry.entryDate,
      status: result.journalEntry.status,
      totalDebit: result.journalEntry.totalDebit,
      totalCredit: result.journalEntry.totalCredit,
      totalLines: result.journalEntry.lines.length,
    },
    summary: {
      totalIncome,
      totalExpense,
      netResult,
      resultAccountCode: resultAccount.code,
      resultAccountName: resultAccount.name,
    },
  });
}

// ============================================================
// Cierre de Resultados del Ejercicio a Capital
// - Toma el saldo de la cuenta "Resultados del Ejercicio"
// - Lo traspasa a la cuenta de Capital
// ============================================================

async function generateNetIncomeClosing(
  companyId: string,
  period: { id: string; year: number; month: number },
  customConcept?: string
) {
  // Buscar la cuenta de Resultados del Ejercicio
  const resultAccount = await db.account.findFirst({
    where: {
      companyId,
      accountType: 'EQUITY',
      isGroup: false,
      isActive: true,
      OR: [
        { code: { contains: '3.0' } },
        { code: { contains: '35' } },
        { name: { contains: 'Resultado' } },
      ],
    },
    select: { id: true, code: true, name: true },
  });

  if (!resultAccount) {
    return error('No se encontró la cuenta de "Resultados del Ejercicio" (tipo EQUITY). Verifique el plan de cuentas.');
  }

  // Buscar la cuenta de Capital
  const capitalAccount = await db.account.findFirst({
    where: {
      companyId,
      accountType: 'EQUITY',
      isGroup: false,
      isActive: true,
      OR: [
        { code: { contains: '3.1' } },
        { code: { contains: '31' } },
        { name: { contains: 'Capital' } },
      ],
    },
    select: { id: true, code: true, name: true },
  });

  if (!capitalAccount) {
    return error('No se encontró la cuenta de "Capital" (tipo EQUITY). Verifique el plan de cuentas.');
  }

  // Calcular el saldo actual de la cuenta de Resultados
  // Buscar todas las partidas de pólizas POSTED en esta cuenta
  const aggregates = await db.journalEntryLine.groupBy({
    by: ['accountId'],
    where: {
      accountId: resultAccount.id,
      journalEntry: {
        companyId,
        status: 'POSTED',
      },
    },
    _sum: {
      debit: true,
      credit: true,
    },
  });

  if (aggregates.length === 0) {
    return error('La cuenta de Resultados del Ejercicio no tiene movimientos. Genere primero el cierre INCOME_EXPENSE.');
  }

  const resultBalance = roundTwo(
    (aggregates[0]._sum.credit ?? 0) - (aggregates[0]._sum.debit ?? 0)
  );

  if (roundTwo(resultBalance) === 0) {
    return error('La cuenta de Resultados del Ejercicio tiene saldo cero. No es necesario cierre a Capital.');
  }

  // Determinar sentido del cierre
  let linesToCreate: { accountId: string; description: string; debit: number; credit: number }[];
  const totalAmount = Math.abs(resultBalance);

  if (resultBalance > 0) {
    // Saldo acreedor (utilidad): se carga Resultados y se abona Capital
    linesToCreate = [
      {
        accountId: resultAccount.id,
        description: `Cierre de Resultados a Capital - ${period.year}`,
        debit: totalAmount,
        credit: 0,
      },
      {
        accountId: capitalAccount.id,
        description: `Traspaso de Resultados - ${period.year}`,
        debit: 0,
        credit: totalAmount,
      },
    ];
  } else {
    // Saldo deudor (pérdida): se abona Resultados y se carga Capital
    linesToCreate = [
      {
        accountId: capitalAccount.id,
        description: `Traspaso de Pérdidas a Capital - ${period.year}`,
        debit: totalAmount,
        credit: 0,
      },
      {
        accountId: resultAccount.id,
        description: `Cierre de Resultados a Capital - ${period.year}`,
        debit: 0,
        credit: totalAmount,
      },
    ];
  }

  // Generar número de póliza secuencial
  const entryNumber = await generateEntryNumber(period.id, companyId);

  // Crear póliza y ClosingEntry en transacción
  const concept = customConcept || `Cierre de Resultados a Capital - Período ${period.year}/${String(period.month).padStart(2, '0')}`;

  const result = await db.$transaction(async (tx) => {
    const journalEntry = await tx.journalEntry.create({
      data: {
        companyId,
        periodId: period.id,
        entryNumber,
        description: concept,
        entryDate: new Date(period.year, period.month, 0),
        entryType: 'DIARIO',
        status: 'DRAFT',
        totalDebit: totalAmount,
        totalCredit: totalAmount,
        difference: 0,
        lines: {
          create: linesToCreate,
        },
      },
    });

    const closingEntry = await tx.closingEntry.create({
      data: {
        companyId,
        periodId: period.id,
        journalEntryId: journalEntry.id,
        closingType: 'NET_INCOME',
        concept,
        totalIncome: 0,
        totalExpense: 0,
        netResult: resultBalance,
      },
    });

    return { closingEntry, journalEntry };
  });

  return created({
    message: 'Asiento de cierre de resultados a capital generado exitosamente',
    closingEntry: result.closingEntry,
    journalEntry: {
      id: result.journalEntry.id,
      entryNumber: result.journalEntry.entryNumber,
      description: result.journalEntry.description,
      entryDate: result.journalEntry.entryDate,
      status: result.journalEntry.status,
      totalDebit: result.journalEntry.totalDebit,
      totalCredit: result.journalEntry.totalCredit,
    },
    summary: {
      resultBalance,
      transferredToCapital: Math.abs(resultBalance),
      resultAccountCode: resultAccount.code,
      capitalAccountCode: capitalAccount.code,
      capitalAccountName: capitalAccount.name,
    },
  });
}
