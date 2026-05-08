import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAuth, success, error } from '@/lib/api-helpers';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await validateAuth(request);
    if (!user) return error('No autorizado', 401);

    const { id } = await params;
    const body = await request.json();
    const { journalLineId } = body;

    if (!journalLineId) {
      return error('Se requiere una línea de diario (JournalEntryLine) para conciliar profesionalmente');
    }

    // 1. Verificar existencia del movimiento y la línea en una transacción
    return await db.$transaction(async (tx) => {
      const movement = await tx.bankMovement.findUnique({
        where: { id },
        include: { bankAccount: true }
      });

      if (!movement) throw new Error('Movimiento bancario no encontrado');
      if (movement.status === 'RECONCILED') throw new Error('El movimiento ya está conciliado');

      const journalLine = await tx.journalEntryLine.findUnique({
        where: { id: journalLineId },
        include: { journalEntry: true }
      });

      if (!journalLine) throw new Error('Línea de diario no encontrada');
      if (journalLine.journalEntry.status !== 'POSTED') {
        throw new Error('Solo se pueden conciliar movimientos contra pólizas POSTEADAS (libros oficiales)');
      }

      // 2. Validar Montos (Audit M13)
      // En contabilidad: DEBITO bancario (salida) = CREDITO contable
      // CREDITO bancario (entrada) = DEBITO contable
      const movementAmount = Math.abs(Number(movement.amount));
      const ledgerAmount = movement.movementType === 'DEBIT' 
        ? Number(journalLine.credit) 
        : Number(journalLine.debit);

      if (Math.abs(movementAmount - ledgerAmount) > 0.01) {
        throw new Error(`Diferencia detectada: Banco (${movementAmount}) vs Contabilidad (${ledgerAmount}). Deben coincidir exactamente.`);
      }

      // 3. Vincular y Conciliar
      const updated = await tx.bankMovement.update({
        where: { id },
        data: { 
          status: 'RECONCILED',
          journalLineId: journalLineId,
          updatedAt: new Date()
        }
      });

      return success({
        message: 'Conciliación contable-bancaria completada con éxito',
        data: updated
      });
    });

  } catch (err: any) {
    console.error('Error en conciliación dual:', err.message);
    return error(err.message || 'Error interno en el proceso de conciliación', 400);
  }
}
