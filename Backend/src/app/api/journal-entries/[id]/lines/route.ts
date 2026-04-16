import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, created, error, notFound, serverError, validateLeafAccounts } from '@/lib/api-helpers';

// Helper para recalcular totales de una póliza
async function recalculateTotals(journalEntryId: string) {
  const lines = await db.journalEntryLine.findMany({
    where: { journalEntryId },
    select: { debit: true, credit: true },
  });

  const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);
  const difference = Math.round((totalDebit - totalCredit) * 100) / 100;

  await db.journalEntry.update({
    where: { id: journalEntryId },
    data: { totalDebit, totalCredit, difference },
  });

  return { totalDebit, totalCredit, difference };
}

// ============================================================
// GET /api/journal-entries/[id]/lines — Listar partidas de una póliza
// Incluye account (id, code, name) y costCenter (id, code, name).
// Ordenadas por fecha de creación.
// ============================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const entry = await db.journalEntry.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!entry) return notFound('Póliza no encontrada');

    const lines = await db.journalEntryLine.findMany({
      where: { journalEntryId: id },
      include: {
        account: { select: { id: true, code: true, name: true } },
        costCenter: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return success(lines);
  } catch (err) {
    console.error('[GET /api/journal-entries/[id]/lines]', err);
    return serverError();
  }
}

// ============================================================
// POST /api/journal-entries/[id]/lines — Agregar partida a póliza DRAFT
// Valida que la póliza esté en DRAFT y la cuenta sea hoja.
// Recalcula totales después de agregar.
// ============================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { accountId, costCenterId, description, debit, credit } = body as {
      accountId?: string;
      costCenterId?: string | null;
      description?: string;
      debit?: number;
      credit?: number;
    };

    // Validaciones básicas
    if (!accountId) return error('El campo accountId es obligatorio.');
    if (typeof debit !== 'number' || typeof credit !== 'number') {
      return error('Los campos debit y credit deben ser numéricos.');
    }
    if (debit < 0 || credit < 0) {
      return error('Los valores debit y credit no pueden ser negativos.');
    }

    // Verificar que la póliza existe y está en DRAFT
    const entry = await db.journalEntry.findUnique({
      where: { id },
      select: { id: true, status: true, companyId: true },
    });

    if (!entry) return notFound('Póliza no encontrada');
    if (entry.status !== 'DRAFT') {
      return error('No se pueden agregar partidas a una póliza publicada (POSTED). Solo se pueden modificar pólizas en estado BORRADOR (DRAFT).');
    }

    // Validar que la cuenta sea hoja
    const leafValidation = await validateLeafAccounts([{ accountId, costCenterId: costCenterId || null, description: description || '', debit, credit }]);
    if (!leafValidation.valid) {
      return error(leafValidation.errors.join(' | '));
    }

    // Crear la partida y recalcular totales en transacción
    const result = await db.$transaction(async (tx) => {
      const line = await tx.journalEntryLine.create({
        data: {
          journalEntryId: id,
          accountId,
          costCenterId: costCenterId || null,
          description: description || '',
          debit,
          credit,
        },
        include: {
          account: { select: { id: true, code: true, name: true } },
          costCenter: { select: { id: true, code: true, name: true } },
        },
      });

      // Recalcular totales
      const allLines = await tx.journalEntryLine.findMany({
        where: { journalEntryId: id },
        select: { debit: true, credit: true },
      });

      const totalDebit = allLines.reduce((sum, l) => sum + (l.debit || 0), 0);
      const totalCredit = allLines.reduce((sum, l) => sum + (l.credit || 0), 0);
      const difference = Math.round((totalDebit - totalCredit) * 100) / 100;

      const updatedEntry = await tx.journalEntry.update({
        where: { id },
        data: { totalDebit, totalCredit, difference },
        select: { id: true, totalDebit: true, totalCredit: true, difference: true, _count: { select: { lines: true } } },
      });

      return { line, totals: updatedEntry };
    });

    return created(result);
  } catch (err) {
    console.error('[POST /api/journal-entries/[id]/lines]', err);
    return serverError();
  }
}

// ============================================================
// PUT /api/journal-entries/[id]/lines — Actualizar partidas en lote (DRAFT)
// Body: { lines: [{ id, description, accountId, costCenterId, debit, credit }] }
// Recalcula totales después de actualizar.
// ============================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { lines } = body as {
      lines?: Array<{
        id?: string;
        description?: string;
        accountId?: string;
        costCenterId?: string | null;
        debit?: number;
        credit?: number;
      }>;
    };

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return error('El campo lines es obligatorio y debe ser un arreglo no vacío.');
    }

    // Verificar que la póliza existe y está en DRAFT
    const entry = await db.journalEntry.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!entry) return notFound('Póliza no encontrada');
    if (entry.status !== 'DRAFT') {
      return error('No se pueden modificar partidas de una póliza publicada (POSTED). Solo se pueden modificar pólizas en estado BORRADOR (DRAFT).');
    }

    // Validar que todas las cuentas sean hojas
    const lineItemsForValidation = lines
      .filter((l) => l.accountId)
      .map((l) => ({
        accountId: l.accountId!,
        costCenterId: l.costCenterId || null,
        description: l.description || '',
        debit: l.debit || 0,
        credit: l.credit || 0,
      }));

    if (lineItemsForValidation.length > 0) {
      const leafValidation = await validateLeafAccounts(lineItemsForValidation);
      if (!leafValidation.valid) {
        return error(leafValidation.errors.join(' | '));
      }
    }

    // Actualizar en transacción
    const result = await db.$transaction(async (tx) => {
      const updatedLines: Awaited<ReturnType<typeof tx.journalEntryLine.update>>[] = [];

      for (const line of lines) {
        if (!line.id) continue;

        const updateData: Record<string, unknown> = {};
        if (line.description !== undefined) updateData.description = line.description;
        if (line.accountId !== undefined) updateData.accountId = line.accountId;
        if (line.costCenterId !== undefined) updateData.costCenterId = line.costCenterId;
        if (line.debit !== undefined) updateData.debit = line.debit;
        if (line.credit !== undefined) updateData.credit = line.credit;

        const updated = await tx.journalEntryLine.update({
          where: { id: line.id },
          data: updateData,
          include: {
            account: { select: { id: true, code: true, name: true } },
            costCenter: { select: { id: true, code: true, name: true } },
          },
        });

        updatedLines.push(updated);
      }

      // Recalcular totales
      const allLines = await tx.journalEntryLine.findMany({
        where: { journalEntryId: id },
        select: { debit: true, credit: true },
      });

      const totalDebit = allLines.reduce((sum, l) => sum + (l.debit || 0), 0);
      const totalCredit = allLines.reduce((sum, l) => sum + (l.credit || 0), 0);
      const difference = Math.round((totalDebit - totalCredit) * 100) / 100;

      const updatedEntry = await tx.journalEntry.update({
        where: { id },
        data: { totalDebit, totalCredit, difference },
        select: { id: true, totalDebit: true, totalCredit: true, difference: true, _count: { select: { lines: true } } },
      });

      return { lines: updatedLines, totals: updatedEntry };
    });

    return success(result);
  } catch (err) {
    console.error('[PUT /api/journal-entries/[id]/lines]', err);
    return serverError();
  }
}
