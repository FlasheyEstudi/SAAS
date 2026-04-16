import { db } from '@/lib/db';
import { success, notFound, serverError } from '@/lib/api-helpers';

// ============================================================
// GET /api/closing-entries/[id] - Obtener asiento de cierre individual
//
// Devuelve el asiento de cierre con todos sus detalles incluyendo
// la póliza de cierre y sus partidas.
// ============================================================

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const closingEntry = await db.closingEntry.findUnique({
      where: { id },
      include: {
        period: {
          select: { id: true, year: true, month: true, status: true },
        },
        journalEntry: {
          include: {
            lines: {
              include: {
                account: {
                  select: { id: true, code: true, name: true, accountType: true },
                },
                costCenter: {
                  select: { id: true, code: true, name: true },
                },
              },
              orderBy: { id: 'asc' },
            },
          },
        },
      },
    });

    if (!closingEntry) {
      return notFound('Asiento de cierre no encontrado');
    }

    return success({
      closingEntry,
      journalEntryLines: closingEntry.journalEntry.lines.map((line) => ({
        id: line.id,
        accountCode: line.account.code,
        accountName: line.account.name,
        accountType: line.account.accountType,
        costCenter: line.costCenter ? {
          code: line.costCenter.code,
          name: line.costCenter.name,
        } : null,
        description: line.description,
        debit: line.debit,
        credit: line.credit,
      })),
    });
  } catch (err) {
    console.error('Error al obtener asiento de cierre:', err);
    return serverError('Error al obtener el asiento de cierre');
  }
}
