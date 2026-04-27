import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const year = searchParams.get('year');

    if (!companyId || !year) return error('companyId y year son obligatorios');

    const entries = await db.journalEntry.findMany({
      where: {
        companyId,
        status: 'POSTED',
        entryDate: { gte: new Date(parseInt(year), 0, 1), lte: new Date(parseInt(year), 11, 31, 23, 59, 59) },
      },
      include: {
        lines: {
          include: {
            account: { select: { id: true, code: true, name: true, accountType: true } },
            costCenter: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    const monthlyData: Record<number, Record<string, number>> = {};
    for (let m = 1; m <= 12; m++) monthlyData[m] = {};

    for (const entry of entries) {
      const month = entry.entryDate.getMonth() + 1;
      for (const line of entry.lines) {
        if (line.account.accountType === 'EXPENSE') {
          const category = line.account.code.substring(0, 5);
          const categoryName = line.account.name;
          if (!monthlyData[month][categoryName]) monthlyData[month][categoryName] = 0;
          monthlyData[month][categoryName] += line.debit - line.credit;
        }
      }
    }

    const allCategories = new Set<string>();
    for (const month of Object.values(monthlyData)) {
      for (const cat of Object.keys(month)) allCategories.add(cat);
    }

    const trends = Array.from(allCategories).map(category => {
      const monthly: any[] = [];
      for (let m = 1; m <= 12; m++) {
        monthly.push({ month: m, amount: Math.round((monthlyData[m][category] || 0) * 100) / 100 });
      }
      const total = monthly.reduce((s, m) => s + (Number(m.amount) || 0), 0);
      return { category, total: Math.round(total * 100) / 100, monthly };
    });

    trends.sort((a, b) => b.total - a.total);

    return success({
      year: parseInt(year),
      totalExpenses: Math.round(trends.reduce((s, t) => s + (Number(t.total) || 0), 0) * 100) / 100,
      categories: trends.length,
      trends,
    });
  } catch (err) {
    console.error('Error fetching expense trends:', err);
    return serverError('Error al obtener tendencias de gastos');
  }
}
