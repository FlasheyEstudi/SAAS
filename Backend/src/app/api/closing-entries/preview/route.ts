import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

// ============================================================
// GET /api/closing-entries/preview - Vista previa de asientos de cierre
// Query params: companyId (requerido), periodId (requerido), closingType
//
// Devuelve qué asientos de cierre se generarían sin crearlos realmente.
// Útil para revisión antes de ejecutar el cierre definitivo.
// Incluye: cuentas afectadas, montos, resultado neto.
// ============================================================

function roundTwo(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const periodId = searchParams.get('periodId');
    const closingType = searchParams.get('closingType') || 'INCOME_EXPENSE';

    if (!companyId || !periodId) {
      return error('Los parámetros companyId y periodId son obligatorios');
    }

    if (!['INCOME_EXPENSE', 'NET_INCOME'].includes(closingType)) {
      return error('El closingType debe ser INCOME_EXPENSE o NET_INCOME');
    }

    // Validar que el período exista
    const period = await db.accountingPeriod.findFirst({
      where: { id: periodId, companyId },
    });

    if (!period) {
      return error('Período contable no encontrado');
    }

    if (closingType === 'INCOME_EXPENSE') {
      return await previewIncomeExpenseClosing(companyId, period);
    } else {
      return await previewNetIncomeClosing(companyId, period);
    }
  } catch (err) {
    console.error('Error al generar vista previa de cierre:', err);
    return serverError('Error al generar la vista previa de cierre');
  }
}

// ============================================================
// Vista previa: Cierre de Ingresos y Gastos
// ============================================================

async function previewIncomeExpenseClosing(
  companyId: string,
  period: { id: string; year: number; month: number; status: string }
) {
  // Obtener cuentas de ingreso y gasto (solo cuentas hoja activas)
  const accounts = await db.account.findMany({
    where: {
      companyId,
      accountType: { in: ['INCOME', 'EXPENSE'] },
      isGroup: false,
      isActive: true,
    },
    select: { id: true, code: true, name: true, accountType: true },
    orderBy: { code: 'asc' },
  });

  const accountIds = accounts.map((a) => a.id);

  // Sumar movimientos de pólizas POSTED
  const lineAggregates = accountIds.length > 0
    ? await db.journalEntryLine.groupBy({
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
      })
    : [];

  // Construir vista previa
  const balanceMap = new Map<string, { totalDebit: number; totalCredit: number }>();
  for (const agg of lineAggregates) {
    balanceMap.set(agg.accountId, {
      totalDebit: roundTwo(agg._sum.debit ?? 0),
      totalCredit: roundTwo(agg._sum.credit ?? 0),
    });
  }

  const previewLines: {
    accountCode: string;
    accountName: string;
    accountType: string;
    currentDebit: number;
    currentCredit: number;
    closingDebit: number;
    closingCredit: number;
    closingBalance: number;
  }[] = [];

  let totalIncome = 0;
  let totalExpense = 0;
  let totalClosingDebit = 0;
  let totalClosingCredit = 0;

  for (const account of accounts) {
    const balance = balanceMap.get(account.id);
    if (!balance) continue;

    let closingDebit = 0;
    let closingCredit = 0;
    let closingBalance = 0;

    if (account.accountType === 'INCOME') {
      const incomeBalance = roundTwo(balance.totalCredit - balance.totalDebit);
      if (incomeBalance > 0) {
        closingDebit = incomeBalance;
        totalIncome += incomeBalance;
      }
      closingBalance = -incomeBalance; // Se reduce el saldo acreedor
    } else if (account.accountType === 'EXPENSE') {
      const expenseBalance = roundTwo(balance.totalDebit - balance.totalCredit);
      if (expenseBalance > 0) {
        closingCredit = expenseBalance;
        totalExpense += expenseBalance;
      }
      closingBalance = -expenseBalance; // Se reduce el saldo deudor
    }

    totalClosingDebit += closingDebit;
    totalClosingCredit += closingCredit;

    previewLines.push({
      accountCode: account.code,
      accountName: account.name,
      accountType: account.accountType,
      currentDebit: balance.totalDebit,
      currentCredit: balance.totalCredit,
      closingDebit,
      closingCredit,
      closingBalance,
    });
  }

  const netResult = roundTwo(totalIncome - totalExpense);

  // Partida de contrapartida a Resultados del Ejercicio
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

  // Verificar si ya existe un cierre de este tipo
  const existingClosing = await db.closingEntry.findFirst({
    where: { companyId, periodId: period.id, closingType: 'INCOME_EXPENSE' },
    select: { id: true },
  });

  return success({
    period: {
      id: period.id,
      year: period.year,
      month: period.month,
      status: period.status,
    },
    closingType: 'INCOME_EXPENSE',
    alreadyExists: !!existingClosing,
    existingClosingId: existingClosing?.id || null,
    canGenerate: period.status === 'OPEN' && !existingClosing,
    summary: {
      accountsAffected: previewLines.length,
      totalIncome: roundTwo(totalIncome),
      totalExpense: roundTwo(totalExpense),
      netResult,
      netResultLabel: netResult >= 0 ? 'UTILIDAD' : 'PÉRDIDA',
      totalClosingDebit: roundTwo(totalClosingDebit),
      totalClosingCredit: roundTwo(totalClosingCredit),
      balances: roundTwo(totalClosingDebit - totalClosingCredit) === 0,
    },
    resultAccount: resultAccount
      ? { code: resultAccount.code, name: resultAccount.name }
      : null,
    closingLines: previewLines,
    warnings: [
      ...(!resultAccount ? ['No se encontró cuenta de "Resultados del Ejercicio" (EQUITY)'] : []),
      ...(previewLines.length === 0 ? ['No hay movimientos de ingreso/gasto en pólizas POSTED para este período'] : []),
      ...(period.status !== 'OPEN' ? [`El período está ${period.status}, no se puede generar cierre`] : []),
    ],
  });
}

// ============================================================
// Vista previa: Cierre de Resultados a Capital
// ============================================================

async function previewNetIncomeClosing(
  companyId: string,
  period: { id: string; year: number; month: number; status: string }
) {
  // Buscar cuenta de Resultados del Ejercicio
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

  // Buscar cuenta de Capital
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

  // Calcular saldo de Resultados del Ejercicio
  let resultBalance = 0;
  if (resultAccount) {
    const aggregates = await db.journalEntryLine.groupBy({
      by: ['accountId'],
      where: {
        accountId: resultAccount.id,
        journalEntry: { companyId, status: 'POSTED' },
      },
      _sum: { debit: true, credit: true },
    });
    if (aggregates.length > 0) {
      resultBalance = roundTwo((aggregates[0]._sum.credit ?? 0) - (aggregates[0]._sum.debit ?? 0));
    }
  }

  // Verificar si ya existe cierre
  const existingClosing = await db.closingEntry.findFirst({
    where: { companyId, periodId: period.id, closingType: 'NET_INCOME' },
    select: { id: true },
  });

  const amount = Math.abs(resultBalance);

  return success({
    period: {
      id: period.id,
      year: period.year,
      month: period.month,
      status: period.status,
    },
    closingType: 'NET_INCOME',
    alreadyExists: !!existingClosing,
    existingClosingId: existingClosing?.id || null,
    canGenerate: period.status === 'OPEN' && !existingClosing && resultBalance !== 0,
    summary: {
      resultAccountBalance: resultBalance,
      resultBalanceLabel: resultBalance > 0 ? 'UTILIDAD ACUMULADA' : resultBalance < 0 ? 'PÉRDIDA ACUMULADA' : 'SALDO CERO',
      amountToTransfer: roundTwo(amount),
      direction: resultBalance > 0
        ? `${resultAccount?.name} → ${capitalAccount?.name}`
        : resultBalance < 0
          ? `${capitalAccount?.name} → ${resultAccount?.name}`
          : 'N/A',
    },
    resultAccount: resultAccount
      ? { code: resultAccount.code, name: resultAccount.name }
      : null,
    capitalAccount: capitalAccount
      ? { code: capitalAccount.code, name: capitalAccount.name }
      : null,
    previewLines: resultBalance !== 0
      ? [
          ...(resultBalance > 0
            ? [
                { accountCode: resultAccount!.code, accountName: resultAccount!.name, debit: amount, credit: 0, description: 'Cierre de Resultados a Capital' },
                { accountCode: capitalAccount!.code, accountName: capitalAccount!.name, debit: 0, credit: amount, description: 'Traspaso de Resultados' },
              ]
            : [
                { accountCode: capitalAccount!.code, accountName: capitalAccount!.name, debit: amount, credit: 0, description: 'Traspaso de Pérdidas a Capital' },
                { accountCode: resultAccount!.code, accountName: resultAccount!.name, debit: 0, credit: amount, description: 'Cierre de Resultados a Capital' },
              ]),
        ]
      : [],
    warnings: [
      ...(!resultAccount ? ['No se encontró cuenta de "Resultados del Ejercicio"'] : []),
      ...(!capitalAccount ? ['No se encontró cuenta de "Capital"'] : []),
      ...(roundTwo(resultBalance) === 0 ? ['La cuenta de Resultados tiene saldo cero, no se requiere cierre'] : []),
      ...(period.status !== 'OPEN' ? [`El período está ${period.status}`] : []),
    ],
  });
}
