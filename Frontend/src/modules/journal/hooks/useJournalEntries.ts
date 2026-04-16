'use client';

import { useState, useEffect, useCallback } from 'react';
import type { JournalEntry, JournalEntryLine, Account, CostCenter, Period, ValidationResponse } from '@/lib/api/types';

// ─── Mock Accounts Tree (20+ accounts) ──────────────────────────────
export const mockAccounts: Account[] = [
  // Assets
  { id: 'acc-1000', companyId: 'comp-1', code: '1000', name: 'Activo', description: 'Total de activos', accountType: 'ASSET', nature: 'DEBIT', isGroup: true, isActive: true, currentBalance: 4_520_000, level: 0 },
  { id: 'acc-1100', companyId: 'comp-1', code: '1100', name: 'Activo Circulante', description: 'Activos a corto plazo', accountType: 'ASSET', nature: 'DEBIT', parentId: 'acc-1000', isGroup: true, isActive: true, currentBalance: 2_150_000, level: 1 },
  { id: 'acc-1101', companyId: 'comp-1', code: '1101', name: 'Caja y Bancos', description: 'Efectivo y depósitos bancarios', accountType: 'ASSET', nature: 'DEBIT', parentId: 'acc-1100', isGroup: false, isActive: true, currentBalance: 1_250_000, level: 2 },
  { id: 'acc-1102', companyId: 'comp-1', code: '1102', name: 'Cuentas por Cobrar Clientes', description: 'CxC comerciales', accountType: 'ASSET', nature: 'DEBIT', parentId: 'acc-1100', isGroup: false, isActive: true, currentBalance: 450_000, level: 2 },
  { id: 'acc-1103', companyId: 'comp-1', code: '1103', name: 'Inventarios', description: 'Existencias de mercancías', accountType: 'ASSET', nature: 'DEBIT', parentId: 'acc-1100', isGroup: false, isActive: true, currentBalance: 320_000, level: 2 },
  { id: 'acc-1104', companyId: 'comp-1', code: '1104', name: 'IVA Acreditable', description: 'IVA por acreditar', accountType: 'ASSET', nature: 'DEBIT', parentId: 'acc-1100', isGroup: false, isActive: true, currentBalance: 130_000, level: 2 },
  { id: 'acc-1200', companyId: 'comp-1', code: '1200', name: 'Activo Fijo', description: 'Activos no circulantes', accountType: 'ASSET', nature: 'DEBIT', parentId: 'acc-1000', isGroup: true, isActive: true, currentBalance: 2_370_000, level: 1 },
  { id: 'acc-1201', companyId: 'comp-1', code: '1201', name: 'Equipo de Cómputo', description: 'Equipo informático', accountType: 'ASSET', nature: 'DEBIT', parentId: 'acc-1200', isGroup: false, isActive: true, currentBalance: 680_000, level: 2 },
  { id: 'acc-1202', companyId: 'comp-1', code: '1202', name: 'Mobiliario y Equipo', description: 'Muebles y enseres de oficina', accountType: 'ASSET', nature: 'DEBIT', parentId: 'acc-1200', isGroup: false, isActive: true, currentBalance: 420_000, level: 2 },
  { id: 'acc-1203', companyId: 'comp-1', code: '1203', name: 'Depreciación Acumulada', description: 'Depreciación de activos fijos', accountType: 'ASSET', nature: 'CREDIT', parentId: 'acc-1200', isGroup: false, isActive: true, currentBalance: -350_000, level: 2 },
  // Liabilities
  { id: 'acc-2000', companyId: 'comp-1', code: '2000', name: 'Pasivo', description: 'Total de pasivos', accountType: 'LIABILITY', nature: 'CREDIT', isGroup: true, isActive: true, currentBalance: 1_850_000, level: 0 },
  { id: 'acc-2100', companyId: 'comp-1', code: '2100', name: 'Pasivo Circulante', description: 'Obligaciones a corto plazo', accountType: 'LIABILITY', nature: 'CREDIT', parentId: 'acc-2000', isGroup: true, isActive: true, currentBalance: 1_200_000, level: 1 },
  { id: 'acc-2101', companyId: 'comp-1', code: '2101', name: 'Proveedores', description: 'Cuentas por pagar a proveedores', accountType: 'LIABILITY', nature: 'CREDIT', parentId: 'acc-2100', isGroup: false, isActive: true, currentBalance: 280_000, level: 2 },
  { id: 'acc-2102', companyId: 'comp-1', code: '2102', name: 'Impuestos por Pagar', description: 'ISR, IVA, etc.', accountType: 'LIABILITY', nature: 'CREDIT', parentId: 'acc-2100', isGroup: false, isActive: true, currentBalance: 175_000, level: 2 },
  { id: 'acc-2103', companyId: 'comp-1', code: '2103', name: 'Acreedores Diversos', description: 'Otras cuentas por pagar', accountType: 'LIABILITY', nature: 'CREDIT', parentId: 'acc-2100', isGroup: false, isActive: true, currentBalance: 95_000, level: 2 },
  { id: 'acc-2104', companyId: 'comp-1', code: '2104', name: 'Anticipo de Clientes', description: 'Anticipos recibidos', accountType: 'LIABILITY', nature: 'CREDIT', parentId: 'acc-2100', isGroup: false, isActive: true, currentBalance: 150_000, level: 2 },
  { id: 'acc-2200', companyId: 'comp-1', code: '2200', name: 'Pasivo Largo Plazo', description: 'Obligaciones a largo plazo', accountType: 'LIABILITY', nature: 'CREDIT', parentId: 'acc-2000', isGroup: false, isActive: true, currentBalance: 650_000, level: 1 },
  // Equity
  { id: 'acc-3000', companyId: 'comp-1', code: '3000', name: 'Capital', description: 'Capital social', accountType: 'EQUITY', nature: 'CREDIT', isGroup: false, isActive: true, currentBalance: 1_500_000, level: 0 },
  { id: 'acc-3100', companyId: 'comp-1', code: '3100', name: 'Utilidades Acumuladas', description: 'Resultados de ejercicios anteriores', accountType: 'EQUITY', nature: 'CREDIT', isGroup: false, isActive: true, currentBalance: 820_000, level: 0 },
  { id: 'acc-3200', companyId: 'comp-1', code: '3200', name: 'Resultado del Ejercicio', description: 'Utilidad o pérdida del período', accountType: 'EQUITY', nature: 'CREDIT', isGroup: false, isActive: true, currentBalance: 350_000, level: 0 },
  // Income
  { id: 'acc-4000', companyId: 'comp-1', code: '4000', name: 'Ingresos', description: 'Ingresos ordinarios', accountType: 'INCOME', nature: 'CREDIT', isGroup: true, isActive: true, currentBalance: 2_850_000, level: 0 },
  { id: 'acc-4100', companyId: 'comp-1', code: '4100', name: 'Ingresos por Servicios', description: 'Venta de servicios contables', accountType: 'INCOME', nature: 'CREDIT', parentId: 'acc-4000', isGroup: false, isActive: true, currentBalance: 2_200_000, level: 1 },
  { id: 'acc-4200', companyId: 'comp-1', code: '4200', name: 'Ingresos Financieros', description: 'Intereses y rendimientos', accountType: 'INCOME', nature: 'CREDIT', parentId: 'acc-4000', isGroup: false, isActive: true, currentBalance: 45_000, level: 1 },
  { id: 'acc-4300', companyId: 'comp-1', code: '4300', name: 'Ingresos por Comisiones', description: 'Comisiones ganadas', accountType: 'INCOME', nature: 'CREDIT', parentId: 'acc-4000', isGroup: false, isActive: true, currentBalance: 125_000, level: 1 },
  { id: 'acc-4400', companyId: 'comp-1', code: '4400', name: 'Ventas de Mercancías', description: 'Ingresos por ventas', accountType: 'INCOME', nature: 'CREDIT', parentId: 'acc-4000', isGroup: false, isActive: true, currentBalance: 480_000, level: 1 },
  // Expenses
  { id: 'acc-5000', companyId: 'comp-1', code: '5000', name: 'Gastos de Operación', description: 'Gastos totales de operación', accountType: 'EXPENSE', nature: 'DEBIT', isGroup: true, isActive: true, currentBalance: 1_920_000, level: 0 },
  { id: 'acc-5100', companyId: 'comp-1', code: '5100', name: 'Gastos de Nómina', description: 'Sueldos, salarios y prestaciones', accountType: 'EXPENSE', nature: 'DEBIT', parentId: 'acc-5000', isGroup: false, isActive: true, currentBalance: 680_000, level: 1 },
  { id: 'acc-5200', companyId: 'comp-1', code: '5200', name: 'Gastos de Servicios', description: 'Servicios profesionales y externos', accountType: 'EXPENSE', nature: 'DEBIT', parentId: 'acc-5000', isGroup: false, isActive: true, currentBalance: 320_000, level: 1 },
  { id: 'acc-5300', companyId: 'comp-1', code: '5300', name: 'Gastos de Oficina', description: 'Insumos y papelería', accountType: 'EXPENSE', nature: 'DEBIT', parentId: 'acc-5000', isGroup: false, isActive: true, currentBalance: 85_000, level: 1 },
  { id: 'acc-5400', companyId: 'comp-1', code: '5400', name: 'Arrendamiento', description: 'Renta de oficinas', accountType: 'EXPENSE', nature: 'DEBIT', parentId: 'acc-5000', isGroup: false, isActive: true, currentBalance: 210_000, level: 1 },
  { id: 'acc-5500', companyId: 'comp-1', code: '5500', name: 'Depreciación', description: 'Depreciación del período', accountType: 'EXPENSE', nature: 'DEBIT', parentId: 'acc-5000', isGroup: false, isActive: true, currentBalance: 128_000, level: 1 },
  { id: 'acc-5600', companyId: 'comp-1', code: '5600', name: 'Impuestos', description: 'ISR e IVA causado', accountType: 'EXPENSE', nature: 'DEBIT', parentId: 'acc-5000', isGroup: false, isActive: true, currentBalance: 195_000, level: 1 },
  { id: 'acc-5700', companyId: 'comp-1', code: '5700', name: 'Gastos de Venta', description: 'Comisiones y gastos de venta', accountType: 'EXPENSE', nature: 'DEBIT', parentId: 'acc-5000', isGroup: false, isActive: true, currentBalance: 178_000, level: 1 },
  { id: 'acc-5800', companyId: 'comp-1', code: '5800', name: 'Gastos Financieros', description: 'Intereses y comisiones bancarias', accountType: 'EXPENSE', nature: 'DEBIT', parentId: 'acc-5000', isGroup: false, isActive: true, currentBalance: 42_000, level: 1 },
  { id: 'acc-5900', companyId: 'comp-1', code: '5900', name: 'Gastos Diversos', description: 'Otros gastos no clasificados', accountType: 'EXPENSE', nature: 'DEBIT', parentId: 'acc-5000', isGroup: false, isActive: true, currentBalance: 82_000, level: 1 },
];

// ─── Mock Cost Centers (5 items) ────────────────────────────────────
export const mockCostCenters: CostCenter[] = [
  { id: 'cc-01', companyId: 'comp-1', code: 'ADM', name: 'Administración', description: 'Área administrativa', isActive: true, journalEntryCount: 45, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'cc-02', companyId: 'comp-1', code: 'CON', name: 'Contabilidad', description: 'Departamento contable', isActive: true, journalEntryCount: 78, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'cc-03', companyId: 'comp-1', code: 'VEN', name: 'Ventas', description: 'Departamento de ventas', isActive: true, journalEntryCount: 32, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'cc-04', companyId: 'comp-1', code: 'OPR', name: 'Operaciones', description: 'Operaciones generales', isActive: true, journalEntryCount: 56, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'cc-05', companyId: 'comp-1', code: 'FIN', name: 'Finanzas', description: 'Departamento financiero', isActive: true, journalEntryCount: 24, createdAt: '2025-01-01T00:00:00Z' },
];

// ─── Mock Periods (3 open periods) ──────────────────────────────────
export const mockPeriods: Period[] = [
  { id: 'per-10', companyId: 'comp-1', name: 'Octubre 2025', startDate: '2025-10-01', endDate: '2025-10-31', status: 'OPEN', year: 2025, month: 10, createdAt: '2025-10-01T00:00:00Z' },
  { id: 'per-11', companyId: 'comp-1', name: 'Noviembre 2025', startDate: '2025-11-01', endDate: '2025-11-30', status: 'OPEN', year: 2025, month: 11, createdAt: '2025-11-01T00:00:00Z' },
  { id: 'per-12', companyId: 'comp-1', name: 'Diciembre 2025', startDate: '2025-12-01', endDate: '2025-12-31', status: 'OPEN', year: 2025, month: 12, createdAt: '2025-12-01T00:00:00Z' },
];

// ─── Helper: get account by id ──────────────────────────────────────
function getAccountById(id: string): Account | undefined {
  return mockAccounts.find((a) => a.id === id);
}
function getCostCenterById(id: string): CostCenter | undefined {
  return mockCostCenters.find((c) => c.id === id);
}

// ─── Mock Journal Entry Lines ───────────────────────────────────────
function makeLines(entryId: string, linesData: { accountId: string; costCenterId?: string; desc: string; debit: number; credit: number }[]): JournalEntryLine[] {
  return linesData.map((l, i) => ({
    id: `${entryId}-line-${i + 1}`,
    journalEntryId: entryId,
    accountId: l.accountId,
    account: getAccountById(l.accountId),
    costCenterId: l.costCenterId,
    costCenter: l.costCenterId ? getCostCenterById(l.costCenterId) : undefined,
    description: l.desc,
    debit: l.debit,
    credit: l.credit,
  }));
}

// ─── Mock 15 Journal Entries ────────────────────────────────────────
const initialMockEntries: JournalEntry[] = [
  {
    id: 'je-001', companyId: 'comp-1', periodId: 'per-12', entryNumber: 'POL-2025-0156',
    description: 'Pago de nómina quincenal Diciembre primera quincena',
    entryDate: '2025-12-15', entryType: 'EGRESO', status: 'POSTED',
    totalDebit: 185000, totalCredit: 185000, difference: 0,
    lines: makeLines('je-001', [
      { accountId: 'acc-5100', costCenterId: 'cc-02', desc: 'Sueldos y salarios personal contable', debit: 125000, credit: 0 },
      { accountId: 'acc-5100', costCenterId: 'cc-01', desc: 'Sueldos personal administrativo', debit: 60000, credit: 0 },
      { accountId: 'acc-1101', desc: 'Pago vía transferencia bancaria', debit: 0, credit: 185000 },
    ]),
    createdBy: 'María García', postedAt: '2025-12-15T10:30:00Z', createdAt: '2025-12-15T09:00:00Z', updatedAt: '2025-12-15T10:30:00Z',
  },
  {
    id: 'je-002', companyId: 'comp-1', periodId: 'per-12', entryNumber: 'POL-2025-0155',
    description: 'Cobro de cliente Grupo Alfa S.A. de C.V.',
    entryDate: '2025-12-14', entryType: 'INGRESO', status: 'POSTED',
    totalDebit: 95400, totalCredit: 95400, difference: 0,
    lines: makeLines('je-002', [
      { accountId: 'acc-1101', desc: 'Depósito bancario BBVA', debit: 95400, credit: 0 },
      { accountId: 'acc-1102', desc: 'Liquidación parcial CxC Grupo Alfa', debit: 0, credit: 83000 },
      { accountId: 'acc-2102', desc: 'IVA trasladado cobrado', debit: 0, credit: 12400 },
    ]),
    createdBy: 'Carlos López', postedAt: '2025-12-14T16:00:00Z', createdAt: '2025-12-14T15:30:00Z', updatedAt: '2025-12-14T16:00:00Z',
  },
  {
    id: 'je-003', companyId: 'comp-1', periodId: 'per-12', entryNumber: 'POL-2025-0154',
    description: 'Provisión de impuesto ISR Diciembre',
    entryDate: '2025-12-13', entryType: 'DIARIO', status: 'DRAFT',
    totalDebit: 42500, totalCredit: 42500, difference: 0,
    lines: makeLines('je-003', [
      { accountId: 'acc-5600', costCenterId: 'cc-05', desc: 'ISR estimado del mes', debit: 42500, credit: 0 },
      { accountId: 'acc-2102', desc: 'ISR por pagar', debit: 0, credit: 42500 },
    ]),
    createdBy: 'María García', createdAt: '2025-12-13T11:00:00Z', updatedAt: '2025-12-13T11:00:00Z',
  },
  {
    id: 'je-004', companyId: 'comp-1', periodId: 'per-12', entryNumber: 'POL-2025-0153',
    description: 'Depreciación mensual equipo de cómputo y mobiliario',
    entryDate: '2025-12-10', entryType: 'DIARIO', status: 'POSTED',
    totalDebit: 12800, totalCredit: 12800, difference: 0,
    lines: makeLines('je-004', [
      { accountId: 'acc-5500', costCenterId: 'cc-02', desc: 'Depreciación equipo de cómputo', debit: 8500, credit: 0 },
      { accountId: 'acc-5500', costCenterId: 'cc-01', desc: 'Depreciación mobiliario y equipo', debit: 4300, credit: 0 },
      { accountId: 'acc-1203', desc: 'Depreciación acumulada equipo', debit: 0, credit: 8500 },
      { accountId: 'acc-1203', desc: 'Depreciación acumulada mobiliario', debit: 0, credit: 4300 },
    ]),
    createdBy: 'Ana Martínez', postedAt: '2025-12-10T14:20:00Z', createdAt: '2025-12-10T14:00:00Z', updatedAt: '2025-12-10T14:20:00Z',
  },
  {
    id: 'je-005', companyId: 'comp-1', periodId: 'per-12', entryNumber: 'POL-2025-0152',
    description: 'Compra de insumos de oficina Papelería MX',
    entryDate: '2025-12-09', entryType: 'EGRESO', status: 'POSTED',
    totalDebit: 8750, totalCredit: 8750, difference: 0,
    lines: makeLines('je-005', [
      { accountId: 'acc-5300', costCenterId: 'cc-01', desc: 'Resma de papel, toner, plumas', debit: 7500, credit: 0 },
      { accountId: 'acc-1104', desc: 'IVA acreditable 16%', debit: 1200, credit: 0 },
      { accountId: 'acc-1101', desc: 'Pago con tarjeta corporativa', debit: 0, credit: 7800 },
      { accountId: 'acc-2102', desc: 'IVA retenido proveedor', debit: 0, credit: 950 },
    ]),
    createdBy: 'Carlos López', postedAt: '2025-12-09T17:00:00Z', createdAt: '2025-12-09T16:30:00Z', updatedAt: '2025-12-09T17:00:00Z',
  },
  {
    id: 'je-006', companyId: 'comp-1', periodId: 'per-12', entryNumber: 'POL-2025-0151',
    description: 'Pago de renta oficinas corporativas Diciembre',
    entryDate: '2025-12-08', entryType: 'EGRESO', status: 'POSTED',
    totalDebit: 35000, totalCredit: 35000, difference: 0,
    lines: makeLines('je-006', [
      { accountId: 'acc-5400', costCenterId: 'cc-01', desc: 'Renta oficina Av. Reforma 250', debit: 30000, credit: 0 },
      { accountId: 'acc-1104', desc: 'IVA acreditable renta', debit: 4800, credit: 0 },
      { accountId: 'acc-1101', desc: 'Transferencia SPEI inmobiliaria', debit: 0, credit: 34800 },
    ]),
    createdBy: 'María García', postedAt: '2025-12-08T10:00:00Z', createdAt: '2025-12-08T09:15:00Z', updatedAt: '2025-12-08T10:00:00Z',
  },
  {
    id: 'je-007', companyId: 'comp-1', periodId: 'per-11', entryNumber: 'POL-2025-0145',
    description: 'Facturación servicios contabilidad Noviembre - Constructora del Norte',
    entryDate: '2025-11-28', entryType: 'INGRESO', status: 'POSTED',
    totalDebit: 174000, totalCredit: 174000, difference: 0,
    lines: makeLines('je-007', [
      { accountId: 'acc-1102', desc: 'CxC Constructora del Norte', debit: 174000, credit: 0 },
      { accountId: 'acc-4100', costCenterId: 'cc-02', desc: 'Honorarios contables mensuales', debit: 0, credit: 150000 },
      { accountId: 'acc-2102', desc: 'IVA trasladado 16%', debit: 0, credit: 24000 },
    ]),
    createdBy: 'Ana Martínez', postedAt: '2025-11-28T16:30:00Z', createdAt: '2025-11-28T15:00:00Z', updatedAt: '2025-11-28T16:30:00Z',
  },
  {
    id: 'je-008', companyId: 'comp-1', periodId: 'per-11', entryNumber: 'POL-2025-0140',
    description: 'Traspaso de fondos entre cuentas bancarias',
    entryDate: '2025-11-25', entryType: 'TRASPASO', status: 'POSTED',
    totalDebit: 200000, totalCredit: 200000, difference: 0,
    lines: makeLines('je-008', [
      { accountId: 'acc-1101', desc: 'Depósito en BBVA desde Banorte', debit: 200000, credit: 0 },
      { accountId: 'acc-1101', desc: 'Retiro de Banorte', debit: 0, credit: 200000 },
    ]),
    createdBy: 'María García', postedAt: '2025-11-25T11:00:00Z', createdAt: '2025-11-25T10:30:00Z', updatedAt: '2025-11-25T11:00:00Z',
  },
  {
    id: 'je-009', companyId: 'comp-1', periodId: 'per-11', entryNumber: 'POL-2025-0138',
    description: 'Pago servicios externos de auditoría',
    entryDate: '2025-11-20', entryType: 'EGRESO', status: 'DRAFT',
    totalDebit: 48000, totalCredit: 48000, difference: 0,
    lines: makeLines('je-009', [
      { accountId: 'acc-5200', costCenterId: 'cc-02', desc: 'Honorarios auditoría externa Q4', debit: 42000, credit: 0 },
      { accountId: 'acc-1104', desc: 'IVA acreditable auditoría', debit: 6720, credit: 0 },
      { accountId: 'acc-2103', desc: 'Acreedor auditor externo', debit: 0, credit: 48720 },
    ]),
    createdBy: 'Carlos López', createdAt: '2025-11-20T14:00:00Z', updatedAt: '2025-11-20T14:00:00Z',
  },
  {
    id: 'je-010', companyId: 'comp-1', periodId: 'per-11', entryNumber: 'POL-2025-0135',
    description: 'Reconciliación y ajuste por diferencia cambiaria',
    entryDate: '2025-11-18', entryType: 'DIARIO', status: 'POSTED',
    totalDebit: 3200, totalCredit: 3200, difference: 0,
    lines: makeLines('je-010', [
      { accountId: 'acc-5800', costCenterId: 'cc-05', desc: 'Pérdida cambiaria USD/MXN', debit: 3200, credit: 0 },
      { accountId: 'acc-1101', desc: 'Ajuste saldo bancario dólares', debit: 0, credit: 3200 },
    ]),
    createdBy: 'Ana Martínez', postedAt: '2025-11-18T09:45:00Z', createdAt: '2025-11-18T09:00:00Z', updatedAt: '2025-11-18T09:45:00Z',
  },
  {
    id: 'je-011', companyId: 'comp-1', periodId: 'per-10', entryNumber: 'POL-2025-0128',
    description: 'Venta de equipo de cómputo obsoleto',
    entryDate: '2025-10-28', entryType: 'INGRESO', status: 'POSTED',
    totalDebit: 15000, totalCredit: 15000, difference: 0,
    lines: makeLines('je-011', [
      { accountId: 'acc-1101', desc: 'Ingreso por venta de activo', debit: 15000, credit: 0 },
      { accountId: 'acc-1201', desc: 'Baja de equipo de cómputo', debit: 0, credit: 22000 },
      { accountId: 'acc-1203', desc: 'Depreciación acumulada del activo', debit: 18000, credit: 0 },
      { accountId: 'acc-5900', desc: 'Pérdida en venta de activo fijo', debit: 0, credit: 11000 },
    ]),
    createdBy: 'María García', postedAt: '2025-10-28T12:00:00Z', createdAt: '2025-10-28T11:30:00Z', updatedAt: '2025-10-28T12:00:00Z',
  },
  {
    id: 'je-012', companyId: 'comp-1', periodId: 'per-10', entryNumber: 'POL-2025-0120',
    description: 'Provisión utilidades del ejercicio Octubre',
    entryDate: '2025-10-31', entryType: 'DIARIO', status: 'POSTED',
    totalDebit: 185000, totalCredit: 185000, difference: 0,
    lines: makeLines('je-012', [
      { accountId: 'acc-4000', desc: 'Cierre de ingresos', debit: 0, credit: 285000 },
      { accountId: 'acc-5000', desc: 'Cierre de gastos', debit: 195000, credit: 0 },
      { accountId: 'acc-3200', desc: 'Resultado del ejercicio', debit: 0, credit: 90000 },
    ]),
    createdBy: 'María García', postedAt: '2025-10-31T23:55:00Z', createdAt: '2025-10-31T23:00:00Z', updatedAt: '2025-10-31T23:55:00Z',
  },
  {
    id: 'je-013', companyId: 'comp-1', periodId: 'per-12', entryNumber: 'POL-2025-0157',
    description: 'Anticipo recibido de Distribuidora del Pacífico',
    entryDate: '2025-12-16', entryType: 'INGRESO', status: 'DRAFT',
    totalDebit: 50000, totalCredit: 50000, difference: 0,
    lines: makeLines('je-013', [
      { accountId: 'acc-1101', desc: 'Depósito anticipo', debit: 50000, credit: 0 },
      { accountId: 'acc-2104', desc: 'Anticipo de cliente Distribuidora', debit: 0, credit: 43103 },
      { accountId: 'acc-2102', desc: 'IVA trasladado', debit: 0, credit: 6897 },
    ]),
    createdBy: 'Carlos López', createdAt: '2025-12-16T08:45:00Z', updatedAt: '2025-12-16T08:45:00Z',
  },
  {
    id: 'je-014', companyId: 'comp-1', periodId: 'per-12', entryNumber: 'POL-2025-0158',
    description: 'Compra de licencias de software contable anual',
    entryDate: '2025-12-17', entryType: 'EGRESO', status: 'DRAFT',
    totalDebit: 29000, totalCredit: 29000, difference: 0,
    lines: makeLines('je-014', [
      { accountId: 'acc-5200', costCenterId: 'cc-02', desc: 'Licencia ContaERP Pro 2026', debit: 25000, credit: 0 },
      { accountId: 'acc-1104', desc: 'IVA acreditable', debit: 4000, credit: 0 },
      { accountId: 'acc-1101', desc: 'Pago con tarjeta', debit: 0, credit: 29000 },
    ]),
    createdBy: 'Ana Martínez', createdAt: '2025-12-17T10:00:00Z', updatedAt: '2025-12-17T10:00:00Z',
  },
  {
    id: 'je-015', companyId: 'comp-1', periodId: 'per-12', entryNumber: 'POL-2025-0159',
    description: 'Aplicación de anticipo a factura Distribuidora del Pacífico',
    entryDate: '2025-12-18', entryType: 'DIARIO', status: 'DRAFT',
    totalDebit: 40600, totalCredit: 40600, difference: 0,
    lines: makeLines('je-015', [
      { accountId: 'acc-1102', desc: 'Cuenta por cobrar - Factura FC-2025-0087', debit: 40600, credit: 0 },
      { accountId: 'acc-2104', desc: 'Aplicación de anticipo', debit: 35000, credit: 0 },
      { accountId: 'acc-2102', desc: 'IVA trasladado', debit: 5600, credit: 0 },
      { accountId: 'acc-4100', costCenterId: 'cc-02', desc: 'Ingreso por asesoría fiscal', debit: 0, credit: 35000 },
    ]),
    createdBy: 'María García', createdAt: '2025-12-18T09:00:00Z', updatedAt: '2025-12-18T09:00:00Z',
  },
];

// ─── Filter types ───────────────────────────────────────────────────
export interface JournalFilters {
  search: string;
  type: string;
  status: string;
  page: number;
  limit: number;
}

const DEFAULT_FILTERS: JournalFilters = {
  search: '',
  type: '',
  status: '',
  page: 1,
  limit: 8,
};

// ─── Delay helper ───────────────────────────────────────────────────
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── In-memory store ────────────────────────────────────────────────
let entriesStore: JournalEntry[] = JSON.parse(JSON.stringify(initialMockEntries));
let nextEntryNum = 160;

// ─── Hook ───────────────────────────────────────────────────────────
export function useJournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<JournalFilters>(DEFAULT_FILTERS);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // ─── Apply filters ────────────────────────────────────────────────
  const applyFilters = useCallback((allEntries: JournalEntry[], f: JournalFilters) => {
    let filtered = [...allEntries];

    if (f.search) {
      const q = f.search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.entryNumber.toLowerCase().includes(q)
      );
    }
    if (f.type) {
      filtered = filtered.filter((e) => e.entryType === f.type);
    }
    if (f.status) {
      filtered = filtered.filter((e) => e.status === f.status);
    }

    // Sort by date desc
    filtered.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

    const t = filtered.length;
    const tp = Math.max(1, Math.ceil(t / f.limit));
    const start = (f.page - 1) * f.limit;
    const paged = filtered.slice(start, start + f.limit);

    setTotal(t);
    setTotalPages(tp);
    setFilteredEntries(paged);
  }, []);

  // ─── getEntries (load) ───────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      entriesStore = JSON.parse(JSON.stringify(initialMockEntries));
      setEntries(entriesStore);
      applyFilters(entriesStore, filters);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Re-filter when filters change
  useEffect(() => {
    if (entries.length > 0) {
      applyFilters(entries, filters);
    }
  }, [filters, entries, applyFilters]);

  // ─── Get single entry ────────────────────────────────────────────
  const getEntry = useCallback(async (id: string): Promise<JournalEntry | null> => {
    await delay(300);
    const found = entriesStore.find((e) => e.id === id);
    return found || null;
  }, []);

  // ─── Create entry ────────────────────────────────────────────────
  const createEntry = useCallback(async (data: {
    description: string;
    entryDate: string;
    entryType: 'DIARIO' | 'EGRESO' | 'INGRESO' | 'TRASPASO';
    periodId: string;
    lines: Omit<JournalEntryLine, 'id' | 'journalEntryId'>[];
    status?: 'DRAFT' | 'POSTED';
  }): Promise<JournalEntry> => {
    await delay(500);

    const totalDebit = data.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = data.lines.reduce((s, l) => s + l.credit, 0);
    const difference = Math.abs(totalDebit - totalCredit);

    const now = new Date().toISOString();
    const newEntry: JournalEntry = {
      id: `je-${Date.now()}`,
      companyId: 'comp-1',
      periodId: data.periodId,
      entryNumber: `POL-2025-${String(nextEntryNum++).padStart(4, '0')}`,
      description: data.description,
      entryDate: data.entryDate,
      entryType: data.entryType,
      status: data.status || 'DRAFT',
      totalDebit,
      totalCredit,
      difference,
      lines: data.lines.map((l, i) => ({
        ...l,
        id: `${`je-${Date.now()}`}-line-${i + 1}`,
        journalEntryId: `je-${Date.now()}`,
        account: getAccountById(l.accountId),
        costCenter: l.costCenterId ? getCostCenterById(l.costCenterId) : undefined,
      })),
      createdBy: 'María García',
      createdAt: now,
      updatedAt: now,
    };

    if (data.status === 'POSTED') {
      newEntry.postedAt = now;
    }

    entriesStore.unshift(newEntry);
    setEntries([...entriesStore]);
    applyFilters(entriesStore, filters);
    return newEntry;
  }, [filters, applyFilters]);

  // ─── Post entry ──────────────────────────────────────────────────
  const postEntry = useCallback(async (id: string): Promise<JournalEntry | null> => {
    await delay(500);
    const idx = entriesStore.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    const entry = entriesStore[idx];
    if (entry.status !== 'DRAFT') return entry;

    const now = new Date().toISOString();
    const updated: JournalEntry = {
      ...entry,
      status: 'POSTED',
      postedAt: now,
      updatedAt: now,
    };

    entriesStore[idx] = updated;
    setEntries([...entriesStore]);
    applyFilters(entriesStore, filters);
    return updated;
  }, [filters, applyFilters]);

  // ─── Delete entry ────────────────────────────────────────────────
  const deleteEntry = useCallback(async (id: string): Promise<boolean> => {
    await delay(500);
    const idx = entriesStore.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    if (entriesStore[idx].status !== 'DRAFT') return false;

    entriesStore.splice(idx, 1);
    setEntries([...entriesStore]);
    applyFilters(entriesStore, filters);
    return true;
  }, [filters, applyFilters]);

  // ─── Validate entry (dry run) ────────────────────────────────────
  const validateEntry = useCallback(async (data: {
    description: string;
    lines: Omit<JournalEntryLine, 'id' | 'journalEntryId'>[];
  }): Promise<ValidationResponse> => {
    await delay(300);

    const errors: string[] = [];
    const totalDebit = data.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = data.lines.reduce((s, l) => s + l.credit, 0);
    const difference = Math.abs(totalDebit - totalCredit);

    if (!data.description.trim()) {
      errors.push('La descripción es obligatoria');
    }
    if (data.lines.length === 0) {
      errors.push('La póliza debe tener al menos una línea');
    }
    if (data.lines.some((l) => !l.accountId)) {
      errors.push('Todas las líneas deben tener una cuenta asignada');
    }
    const linesWithoutAmount = data.lines.filter((l) => l.debit === 0 && l.credit === 0);
    if (linesWithoutAmount.length > 0) {
      errors.push('Cada línea debe tener un valor en Debe o Haber');
    }
    const linesWithBoth = data.lines.filter((l) => l.debit > 0 && l.credit > 0);
    if (linesWithBoth.length > 0) {
      errors.push('Una línea no puede tener valor en Debe y Haber simultáneamente');
    }

    return {
      valid: errors.length === 0 && difference <= 0.01,
      difference,
      errors: errors.length > 0 ? errors : undefined,
    };
  }, []);

  // ─── Filter setters ──────────────────────────────────────────────
  const setSearch = useCallback((value: string) => {
    setFilters((f) => ({ ...f, search: value, page: 1 }));
  }, []);
  const setTypeFilter = useCallback((value: string) => {
    setFilters((f) => ({ ...f, type: value, page: 1 }));
  }, []);
  const setStatusFilter = useCallback((value: string) => {
    setFilters((f) => ({ ...f, status: value, page: 1 }));
  }, []);
  const setPage = useCallback((page: number) => {
    setFilters((f) => ({ ...f, page }));
  }, []);
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    entries: filteredEntries,
    allEntries: entries,
    isLoading,
    total,
    totalPages,
    page: filters.page,
    limit: filters.limit,
    search: filters.search,
    typeFilter: filters.type,
    statusFilter: filters.status,
    setSearch,
    setTypeFilter,
    setStatusFilter,
    setPage,
    clearFilters,
    getEntry,
    createEntry,
    postEntry,
    deleteEntry,
    validateEntry,
    accounts: mockAccounts.filter((a) => !a.isGroup),
    costCenters: mockCostCenters,
    periods: mockPeriods,
    refetch: () => {
      setIsLoading(true);
      setTimeout(() => {
        setEntries([...entriesStore]);
        applyFilters(entriesStore, filters);
        setIsLoading(false);
      }, 500);
    },
  };
}
