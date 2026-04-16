import { NextRequest } from 'next/server';
import { success, error, validateDoubleEntry, validateLeafAccounts, validatePeriodOpen, type LineItem } from '@/lib/api-helpers';

// ============================================================
// POST /api/journal-entries/validate — Validar partidas sin crear nada
// Útil para validación en tiempo real en el frontend.
// Retorna: valid, errors, totalDebit, totalCredit, difference, periodStatus
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lines, companyId, periodId } = body as {
      lines?: LineItem[];
      companyId?: string;
      periodId?: string;
    };

    const errors: string[] = [];
    let periodStatus: string | null = null;

    // --- Validaciones básicas ---
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      errors.push('Debe proporcionar al menos una partida.');
    } else {
      if (lines.length < 2) {
        errors.push('La póliza debe tener al menos 2 partidas.');
      }

      // Validar campos de cada línea
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.accountId) {
          errors.push(`La partida ${i + 1} no tiene cuenta (accountId).`);
        }
        if (typeof line.debit !== 'number' || typeof line.credit !== 'number') {
          errors.push(`La partida ${i + 1} debe tener valores numéricos para debit y credit.`);
        } else if (line.debit < 0 || line.credit < 0) {
          errors.push(`La partida ${i + 1} no puede tener valores negativos.`);
        } else if (line.debit === 0 && line.credit === 0) {
          errors.push(`La partida ${i + 1} tiene débito y crédito en cero.`);
        }
      }
    }

    if (!companyId) {
      errors.push('El campo companyId es obligatorio.');
    }
    if (!periodId) {
      errors.push('El campo periodId es obligatorio.');
    }

    // --- Validar partida doble (si hay líneas válidas) ---
    const doubleEntry = {
      valid: true,
      totalDebit: 0,
      totalCredit: 0,
      difference: 0,
    };

    if (lines && lines.length > 0 && errors.length === 0) {
      const result = validateDoubleEntry(lines);
      Object.assign(doubleEntry, result);

      if (!result.valid) {
        errors.push(
          `La póliza no cuadra. Diferencia: $${result.difference.toFixed(2)}. ` +
          `Total Débitos: $${result.totalDebit.toFixed(2)}, Total Créditos: $${result.totalCredit.toFixed(2)}.`
        );
      }
    }

    // --- Validar cuentas hoja (si hay líneas válidas y sin errores previos) ---
    if (lines && lines.length > 0 && errors.length === 0) {
      const leafValidation = await validateLeafAccounts(lines);
      if (!leafValidation.valid) {
        errors.push(...leafValidation.errors);
      }
    }

    // --- Validar período abierto ---
    if (periodId) {
      const periodValidation = await validatePeriodOpen(periodId);
      periodStatus = periodValidation.period?.status || 'UNKNOWN';

      if (!periodValidation.valid) {
        errors.push(periodValidation.error!);
      }
    }

    return success({
      valid: errors.length === 0,
      errors,
      totalDebit: doubleEntry.totalDebit,
      totalCredit: doubleEntry.totalCredit,
      difference: doubleEntry.difference,
      periodStatus,
    });
  } catch (err) {
    console.error('[POST /api/journal-entries/validate]', err);
    return success({
      valid: false,
      errors: ['Error interno al realizar las validaciones.'],
      totalDebit: 0,
      totalCredit: 0,
      difference: 0,
      periodStatus: null,
    });
  }
}
