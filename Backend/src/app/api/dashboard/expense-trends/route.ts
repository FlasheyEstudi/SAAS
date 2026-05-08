import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const year = searchParams.get('year');

    if (!companyId || !year) return error('companyId y year son obligatorios');

    // 1. Obtener agregaciones directamente de la DB (Audit Dashboard)
    const stats = await db.journalEntryLine.groupBy({
      by: ['accountId'],
      where: {
        journalEntry: {
          companyId,
          status: 'POSTED',
          entryDate: { 
            gte: new Date(parseInt(year), 0, 1), 
            lte: new Date(parseInt(year), 11, 31, 23, 59, 59) 
          },
        },
        account: { accountType: 'EXPENSE' }
      },
      _sum: { debit: true, credit: true },
    });

    if (stats.length === 0) {
      return success({ year: parseInt(year), totalExpenses: 0, categories: 0, trends: [] });
    }

    // 2. Obtener nombres de cuentas involucradas
    const accountIds = stats.map(s => s.accountId);
    const accounts = await db.account.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, name: true }
    });

    // 3. Consultar datos mensuales (una consulta por mes es más limpia para el mapeo que un groupBy complejo en SQLite)
    const trends = [];
    let totalYearExpenses = 0;

    for (const acc of accounts) {
      const monthly = [];
      let totalAcc = 0;
      
      for (let m = 1; m <= 12; m++) {
        const start = new Date(parseInt(year), m - 1, 1);
        const end = new Date(parseInt(year), m, 0, 23, 59, 59);
        
        const monthStat = await db.journalEntryLine.aggregate({
          where: {
            accountId: acc.id,
            journalEntry: { companyId, status: 'POSTED', entryDate: { gte: start, lte: end } }
          },
          _sum: { debit: true, credit: true }
        });
        
        const amount = Math.round((Number(monthStat._sum.debit || 0) - Number(monthStat._sum.credit || 0)) * 100) / 100;
        monthly.push({ month: m, amount });
        totalAcc += amount;
      }
      
      totalYearExpenses += totalAcc;
      trends.push({
        category: acc.name,
        total: Math.round(totalAcc * 100) / 100,
        monthly
      });
    }

    trends.sort((a, b) => b.total - a.total);

    return success({
      year: parseInt(year),
      totalExpenses: Math.round(totalYearExpenses * 100) / 100,
      categories: trends.length,
      trends,
    });
  } catch (err) {
    console.error('Error fetching expense trends:', err);
    return serverError('Error al obtener tendencias de gastos');
  }
}
