import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    if (!companyId) return error('companyId es obligatorio');

    const bankAccounts = await db.bankAccount.findMany({
      where: { companyId, isActive: true },
      orderBy: { bankName: 'asc' },
    });

    const totalCurrent = bankAccounts.reduce((s, a) => s + a.currentBalance, 0);

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const currentMonthMovements = await db.bankMovement.findMany({
      where: {
        bankAccount: { companyId },
        movementDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    });
    const previousMonthMovements = await db.bankMovement.findMany({
      where: {
        bankAccount: { companyId },
        movementDate: { 
          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
          lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        },
      },
    });

    const currentInflows = currentMonthMovements.filter(m => m.movementType === 'CREDIT').reduce((s, m) => s + m.amount, 0);
    const currentOutflows = currentMonthMovements.filter(m => m.movementType === 'DEBIT').reduce((s, m) => s + m.amount, 0);
    const previousInflows = previousMonthMovements.filter(m => m.movementType === 'CREDIT').reduce((s, m) => s + m.amount, 0);
    const previousOutflows = previousMonthMovements.filter(m => m.movementType === 'DEBIT').reduce((s, m) => s + m.amount, 0);

    return success({
      totalCash: Math.round(totalCurrent * 100) / 100,
      accounts: bankAccounts.map(a => ({
        id: a.id,
        bankName: a.bankName,
        accountNumber: a.accountNumber,
        currency: a.currency,
        currentBalance: Math.round(a.currentBalance * 100) / 100,
      })),
      currentMonth: {
        inflows: Math.round(currentInflows * 100) / 100,
        outflows: Math.round(currentOutflows * 100) / 100,
        net: Math.round((currentInflows - currentOutflows) * 100) / 100,
      },
      previousMonth: {
        inflows: Math.round(previousInflows * 100) / 100,
        outflows: Math.round(previousOutflows * 100) / 100,
        net: Math.round((previousInflows - previousOutflows) * 100) / 100,
      },
      changePercent: previousInflows - previousOutflows !== 0
        ? Math.round(((currentInflows - currentOutflows - (previousInflows - previousOutflows)) / Math.abs(previousInflows - previousOutflows)) * 10000) / 100
        : 0,
    });
  } catch (err) {
    console.error('Error fetching cash positions:', err);
    return serverError('Error al obtener posiciones de efectivo');
  }
}
