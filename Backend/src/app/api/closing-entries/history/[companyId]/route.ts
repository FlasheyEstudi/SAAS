import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

// ============================================================
// GET /api/closing-entries/history/[companyId] - Historial de cierres por empresa
//
// Devuelve todos los asientos de cierre de una empresa agrupados
// por período, con resumen acumulado de ingresos, gastos y resultado.
// Permite ver el historial completo de cierres contables.
// ============================================================

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;

    if (!companyId) {
      return error('El parámetro companyId es obligatorio');
    }

    // Verificar que la empresa existe
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true },
    });

    if (!company) {
      return error('Empresa no encontrada');
    }

    // Obtener todos los asientos de cierre de la empresa con detalles
    const closingEntries = await db.closingEntry.findMany({
      where: { companyId },
      include: {
        period: {
          select: { id: true, year: true, month: true, status: true },
        },
        journalEntry: {
          select: {
            id: true,
            entryNumber: true,
            description: true,
            entryDate: true,
            status: true,
            totalDebit: true,
            totalCredit: true,
          },
        },
      },
      orderBy: [
        { period: { year: 'asc' } },
        { period: { month: 'asc' } },
        { closingType: 'asc' },
      ],
    });

    // Agrupar por período
    const periodMap = new Map<string, {
      period: { id: string; year: number; month: number; status: string };
      label: string;
      closings: typeof closingEntries;
    }>();

    for (const entry of closingEntries) {
      const key = entry.periodId;
      if (!periodMap.has(key)) {
        periodMap.set(key, {
          period: entry.period,
          label: `${entry.period.year}-${String(entry.period.month).padStart(2, '0')}`,
          closings: [],
        });
      }
      periodMap.get(key)!.closings.push(entry);
    }

    // Construir resumen por período
    const periodsSummary = Array.from(periodMap.values()).map((group) => {
      const incomeExpenseClosing = group.closings.find((c) => c.closingType === 'INCOME_EXPENSE');
      const netIncomeClosing = group.closings.find((c) => c.closingType === 'NET_INCOME');
      const otherClosings = group.closings.filter((c) => !['INCOME_EXPENSE', 'NET_INCOME'].includes(c.closingType));

      return {
        period: group.period,
        label: group.label,
        closingsCount: group.closings.length,
        types: group.closings.map((c) => c.closingType),
        incomeExpense: incomeExpenseClosing
          ? {
              id: incomeExpenseClosing.id,
              totalIncome: incomeExpenseClosing.totalIncome,
              totalExpense: incomeExpenseClosing.totalExpense,
              netResult: incomeExpenseClosing.netResult,
              journalEntryNumber: incomeExpenseClosing.journalEntry.entryNumber,
              journalEntryStatus: incomeExpenseClosing.journalEntry.status,
            }
          : null,
        netIncome: netIncomeClosing
          ? {
              id: netIncomeClosing.id,
              netResult: netIncomeClosing.netResult,
              journalEntryNumber: netIncomeClosing.journalEntry.entryNumber,
              journalEntryStatus: netIncomeClosing.journalEntry.status,
            }
          : null,
        otherClosings: otherClosings.map((c) => ({
          id: c.id,
          closingType: c.closingType,
          concept: c.concept,
          journalEntryNumber: c.journalEntry.entryNumber,
        })),
      };
    });

    // Calcular totales acumulados
    let accumulatedIncome = 0;
    let accumulatedExpense = 0;
    let accumulatedNetResult = 0;
    let totalClosings = 0;

    for (const entry of closingEntries) {
      if (entry.closingType === 'INCOME_EXPENSE') {
        accumulatedIncome += entry.totalIncome;
        accumulatedExpense += entry.totalExpense;
        accumulatedNetResult += entry.netResult;
      }
      totalClosings++;
    }

    return success({
      company: { id: company.id, name: company.name },
      totalClosings,
      periods: periodsSummary,
      accumulatedSummary: {
        totalIncome: Math.round(accumulatedIncome * 100) / 100,
        totalExpense: Math.round(accumulatedExpense * 100) / 100,
        netResult: Math.round(accumulatedNetResult * 100) / 100,
        netResultLabel: accumulatedNetResult >= 0 ? 'UTILIDAD ACUMULADA' : 'PÉRDIDA ACUMULADA',
      },
    });
  } catch (err) {
    console.error('Error al obtener historial de cierres:', err);
    return serverError('Error al obtener el historial de asientos de cierre');
  }
}
