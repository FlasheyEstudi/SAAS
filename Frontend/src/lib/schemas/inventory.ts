import { z } from 'zod';

export const thirdPartySchema = z.object({
  companyId: z.string().min(1, 'companyId es obligatorio'),
  type: z.enum(['CUSTOMER', 'SUPPLIER', 'BOTH']),
  taxId: z.string().nullable().optional(),
  name: z.string().min(2, 'El nombre es obligatorio'),
  email: z.string().email('Email inválido').nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const invoiceLineSchema = z.object({
  lineNumber: z.number(),
  description: z.string().min(1, 'Descripción obligatoria'),
  quantity: z.number().positive('Cantidad debe ser positiva'),
  unitPrice: z.number().nonnegative('Precio no puede ser negativo'),
  unit: z.string().default('PIEZA'),
  discountRate: z.number().min(0).max(100).default(0),
  subtotal: z.number(),
  taxBase: z.number(),
  accountId: z.string().nullable().optional(),
  costCenterId: z.string().nullable().optional(),
});

export const invoiceSchema = z.object({
  companyId: z.string().min(1, 'companyId es obligatorio'),
  thirdPartyId: z.string().min(1, 'thirdPartyId es obligatorio'),
  invoiceType: z.enum(['SALE', 'PURCHASE']),
  number: z.string().min(1, 'Número de factura es obligatorio'),
  issueDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()).nullable().optional(),
  totalAmount: z.number().nonnegative(),
  balanceDue: z.number().nonnegative(),
  status: z.enum(['PENDING', 'PARTIAL', 'PAID', 'CANCELLED']).default('PENDING'),
  subtotal: z.number().default(0),
  taxAmount: z.number().default(0),
  discountAmount: z.number().default(0),
  description: z.string().nullable().optional(),
  lines: z.array(invoiceLineSchema).min(1, 'La factura debe tener al menos una línea'),
});
