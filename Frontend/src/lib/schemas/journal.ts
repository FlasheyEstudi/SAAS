import { z } from 'zod';

export const journalLineSchema = z.object({
  accountId: z.string().min(1, 'La cuenta es obligatoria'),
  costCenterId: z.string().nullable().optional(),
  description: z.string().min(1, 'La descripción de la línea es obligatoria'),
  debit: z.number().nonnegative('El débito no puede ser negativo'),
  credit: z.number().nonnegative('El crédito no puede ser negativo'),
});

export const journalEntrySchema = z.object({
  companyId: z.string().min(1, 'El companyId es obligatorio'),
  periodId: z.string().min(1, 'El periodId es obligatorio'),
  description: z.string().min(3, 'La descripción general es muy corta'),
  entryDate: z.string().or(z.date()),
  entryType: z.enum(['DIARIO', 'EGRESO', 'INGRESO', 'TRASPASO']),
  lines: z.array(journalLineSchema).min(2, 'La póliza debe tener al menos 2 partidas'),
});
