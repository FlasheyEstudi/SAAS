import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error, validateAuth, requireAuth } from '@/lib/api-helpers';
import { logAuditTx } from '@/lib/audit-service';

/**
 * POST /api/exchange/revaluate
 * Genera el asiento de Diferencial Cambiario para cuentas de Banco.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await validateAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const body = await request.json();
    const { companyId, date, marketRate, incomeAccountId, expenseAccountId } = body;

    if (!marketRate || !incomeAccountId || !expenseAccountId) {
      return error('Faltan parámetros (marketRate, incomeAccountId, expenseAccountId)');
    }

    const targetCompanyId = companyId || user!.companyId;
    const revalDate = new Date(date || new Date());

    // 1. Obtener saldos de bancos
    const bankAccounts = await db.bankAccount.findMany({
      where: { companyId: targetCompanyId, isActive: true, currency: 'USD' } // Solo revaluamos USD
    });

    if (bankAccounts.length === 0) {
      return success({ message: 'No hay cuentas en USD para revaluar' });
    }

    // 2. Obtener periodo contable
    const period = await db.accountingPeriod.findFirst({
      where: { 
        companyId: targetCompanyId, 
        year: revalDate.getFullYear(), 
        month: revalDate.getMonth() + 1,
        status: 'OPEN'
      }
    });

    if (!period) return error('No hay un periodo contable ABIERTO para esta fecha');

    // 3. Calcular Diferencial en Transacción
    return await db.$transaction(async (tx) => {
      let totalGain = 0;
      let totalLoss = 0;
      const jeLines: any[] = [];

      // Mapear cuenta de cada banco (esto asume que el banco tiene una cuenta contable vinculada)
      // En este ERP simplificado, buscaremos la cuenta contable que coincida con el nombre del banco o esté en el catálogo.
      // Para esta implementación "Elite", buscaremos cuentas de tipo ASSET que tengan el nombre del banco.
      
      for (const bank of bankAccounts) {
        const currentBalanceUSD = Number(bank.currentBalance);
        
        // Simulación: Buscamos la cuenta contable vinculada (Audit M13 - Mapping)
        const account = await tx.account.findFirst({
          where: { companyId: targetCompanyId, name: { contains: bank.bankName }, accountType: 'ASSET' }
        });

        if (!account) continue;

        // Saldo actual en libros (NIO)
        const agg = await tx.journalEntryLine.aggregate({
          where: { 
            accountId: account.id, 
            journalEntry: { status: 'POSTED', companyId: targetCompanyId } 
          },
          _sum: { debit: true, credit: true }
        });

        const currentBookNIO = Number(agg._sum.debit || 0) - Number(agg._sum.credit || 0);
        const expectedBookNIO = Math.round(currentBalanceUSD * marketRate * 100) / 100;
        const diff = expectedBookNIO - currentBookNIO;

        if (Math.abs(diff) < 0.01) continue;

        if (diff > 0) {
          // Ganancia
          jeLines.push({
            accountId: account.id,
            description: `Ajuste Diferencial Cambiario (+) - ${bank.bankName}`,
            debit: Math.abs(diff),
            credit: 0
          });
          totalGain += Math.abs(diff);
        } else {
          // Pérdida
          jeLines.push({
            accountId: account.id,
            description: `Ajuste Diferencial Cambiario (-) - ${bank.bankName}`,
            debit: 0,
            credit: Math.abs(diff)
          });
          totalLoss += Math.abs(diff);
        }
      }

      if (jeLines.length === 0) return success({ message: 'No se requiere ajuste de diferencial' });

      // Contrapartida (Ingreso o Gasto por Diferencial)
      if (totalGain > 0) {
        jeLines.push({
          accountId: incomeAccountId,
          description: 'Ganancia por Diferencial Cambiario',
          debit: 0,
          credit: totalGain
        });
      }
      if (totalLoss > 0) {
        jeLines.push({
          accountId: expenseAccountId,
          description: 'Pérdida por Diferencial Cambiario',
          debit: totalLoss,
          credit: 0
        });
      }

      // Crear Póliza
      const journalEntry = await tx.journalEntry.create({
        data: {
          companyId: targetCompanyId,
          periodId: period.id,
          entryNumber: `DC-${revalDate.getTime()}`,
          description: `Cierre Mensual: Revaluación de Activos Monetarios (Tasa: ${marketRate})`,
          entryDate: revalDate,
          entryType: 'TRASPASO',
          status: 'DRAFT',
          totalDebit: totalGain + totalLoss,
          totalCredit: totalGain + totalLoss,
          lines: { create: jeLines }
        }
      });

      await logAuditTx(tx, {
        companyId: targetCompanyId,
        userId: user!.id,
        action: 'CREATE',
        entityType: 'JournalEntry',
        entityId: journalEntry.id,
        entityLabel: `Diferencial Cambiario ${revalDate.toLocaleDateString()}`,
        newValues: { marketRate, totalGain, totalLoss }
      });

      return success({
        message: 'Asiento de Diferencial Cambiario generado en DRAFT',
        data: journalEntry
      });
    });

  } catch (err: any) {
    console.error('Error en Revaluación:', err);
    return error('Error al procesar diferencial cambiario: ' + err.message);
  }
}
