import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAuth, success, error, serverError } from '@/lib/api-helpers';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await validateAuth(request);
    if (!user) return error('No autorizado', 401);

    const { id } = await params;

    // 1. Obtener el periodo y validar
    const period = await db.accountingPeriod.findUnique({
      where: { id },
      include: { company: true }
    });

    if (!period) return error('Periodo no encontrado', 404);
    if (period.status !== 'OPEN') return error('El periodo ya está cerrado o bloqueado');

    // 2. VERIFICACIÓN DE INTEGRIDAD: No pueden existir pólizas en DRAFT (Audit M10)
    const draftEntries = await db.journalEntry.count({
      where: { periodId: id, status: 'DRAFT' }
    });
    if (draftEntries > 0) {
      return error(`No se puede cerrar el período. Existen ${draftEntries} pólizas en estado "Borrador" que deben ser publicadas o eliminadas.`);
    }

    // 3. Obtener cuentas de Ingresos y Gastos con saldo
    const accounts = await db.account.findMany({
      where: { 
        companyId: period.companyId,
        accountType: { in: ['INCOME', 'EXPENSE'] },
        isGroup: false 
      }
    });

    // 4. Calcular saldos actuales para cada cuenta
    const journalLines = await db.journalEntryLine.groupBy({
      by: ['accountId'],
      where: {
        journalEntry: {
          companyId: period.companyId,
          status: 'POSTED',
          periodId: period.id
        }
      },
      _sum: { debit: true, credit: true }
    });

    const linesToCreate: any[] = [];
    let totalIncome = 0;
    let totalExpense = 0;

    for (const line of journalLines) {
      const account = accounts.find(a => a.id === line.accountId);
      if (!account) continue;

      const balance = Number(line._sum.debit || 0) - Number(line._sum.credit || 0);
      if (balance === 0) continue;

      if (account.accountType === 'INCOME') {
        totalIncome += Math.abs(balance);
        linesToCreate.push({
          accountId: account.id,
          debit: Math.abs(balance),
          credit: 0,
          description: `Cierre de periodo ${period.month}/${period.year}`
        });
      } else {
        totalExpense += Math.abs(balance);
        linesToCreate.push({
          accountId: account.id,
          debit: 0,
          credit: Math.abs(balance),
          description: `Cierre de periodo ${period.month}/${period.year}`
        });
      }
    }

    if (linesToCreate.length === 0) {
      await db.accountingPeriod.update({ where: { id }, data: { status: 'CLOSED' } });
      return success({ message: 'Periodo cerrado (sin movimientos)' });
    }

    // 5. Calcular resultado neto y cuenta de destino (Capital)
    const metadata = (period.company.metadata as any) || {};
    const resultsAccountCode = metadata.accountMapping?.resultadosAcumulados || '3.2';

    const netResult = totalIncome - totalExpense;
    const equityAccount = await db.account.findFirst({
      where: { companyId: period.companyId, code: resultsAccountCode }
    });

    if (!equityAccount) return error(`No se encontró la cuenta de Resultados Acumulados (${resultsAccountCode})`);

    // El cuadre del asiento
    if (netResult > 0) {
      linesToCreate.push({
        accountId: equityAccount.id,
        debit: 0,
        credit: Math.abs(netResult),
        description: `Utilidad del periodo ${period.month}/${period.year}`
      });
    } else {
      linesToCreate.push({
        accountId: equityAccount.id,
        debit: Math.abs(netResult),
        credit: 0,
        description: `Pérdida del periodo ${period.month}/${period.year}`
      });
    }

    // 5. Ejecutar Cierre en Transacción
    await db.$transaction(async (tx) => {
      // 5.1 Crear Póliza de Cierre
      const je = await tx.journalEntry.create({
        data: {
          companyId: period.companyId,
          periodId: period.id,
          entryNumber: `CIE-${period.year}${period.month.toString().padStart(2, '0')}`,
          description: `Asiento de cierre mensual - ${period.month}/${period.year}`,
          entryDate: new Date(period.year, period.month, 0), // Último día del mes
          entryType: 'TRASPASO',
          status: 'POSTED',
          totalDebit: linesToCreate.reduce((sum, l) => sum + l.debit, 0),
          totalCredit: linesToCreate.reduce((sum, l) => sum + l.credit, 0),
          lines: { create: linesToCreate }
        }
      });

      // 5.2 Registrar el cierre
      await tx.closingEntry.create({
        data: {
          companyId: period.companyId,
          periodId: period.id,
          journalEntryId: je.id,
          closingType: 'INCOME_EXPENSE',
          concept: `Cierre mensual ${period.month}/${period.year}`,
          totalIncome,
          totalExpense,
          netResult
        }
      });

      // 5.3 Cerrar el periodo
      await tx.accountingPeriod.update({
        where: { id: period.id },
        data: { status: 'CLOSED' }
      });
    });

    return success({ message: 'Periodo cerrado exitosamente con asiento de cierre' });

  } catch (err) {
    console.error('Error al cerrar periodo:', err);
    return serverError('Error interno al procesar el cierre');
  }
}
