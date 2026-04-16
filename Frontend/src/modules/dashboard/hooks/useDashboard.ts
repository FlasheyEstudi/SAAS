'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DashboardKPIs, JournalEntry, Invoice } from '@/lib/api/types';

// ─── Mock Data Types ───────────────────────────────────────────────
export interface RevenueTrendItem {
  month: string;
  ingresos: number;
  egresos: number;
  utilidad: number;
}

export interface ExpenseCategoryItem {
  categoria: string;
  monto: number;
  color: string;
}

export interface TopClientItem {
  id: string;
  nombre: string;
  totalFacturado: number;
  facturasPagadas: number;
  facturasPendientes: number;
  initials: string;
  color: string;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  revenueTrend: RevenueTrendItem[];
  expenseCategories: ExpenseCategoryItem[];
  recentJournalEntries: JournalEntry[];
  recentInvoices: Invoice[];
  topClients: TopClientItem[];
}

// ─── Mock KPIs ─────────────────────────────────────────────────────
const mockKPIs: DashboardKPIs = {
  totalRevenue: 2_850_000,
  totalExpenses: 1_920_000,
  netIncome: 930_000,
  accountsReceivable: 450_000,
  accountsPayable: 280_000,
  cashBalance: 1_250_000,
  overdueInvoices: 12,
  pendingJournalEntries: 8,
  revenueChange: 12.5,
  expenseChange: 5.2,
};

// ─── Mock Revenue Trend (last 6 months) ───────────────────────────
const mockRevenueTrend: RevenueTrendItem[] = [
  { month: 'Jul 2025', ingresos: 380_000, egresos: 265_000, utilidad: 115_000 },
  { month: 'Ago 2025', ingresos: 420_000, egresos: 290_000, utilidad: 130_000 },
  { month: 'Sep 2025', ingresos: 395_000, egresos: 310_000, utilidad: 85_000 },
  { month: 'Oct 2025', ingresos: 510_000, egresos: 340_000, utilidad: 170_000 },
  { month: 'Nov 2025', ingresos: 545_000, egresos: 355_000, utilidad: 190_000 },
  { month: 'Dic 2025', ingresos: 600_000, egresos: 360_000, utilidad: 240_000 },
];

// ─── Mock Expense Categories ───────────────────────────────────────
const mockExpenseCategories: ExpenseCategoryItem[] = [
  { categoria: 'Nóminas', monto: 680_000, color: '#FFB6C1' },
  { categoria: 'Servicios', monto: 320_000, color: '#D4A5A5' },
  { categoria: 'Insumos', monto: 245_000, color: '#E6E6FA' },
  { categoria: 'Arrendamiento', monto: 210_000, color: '#F5E6D3' },
  { categoria: 'Impuestos', monto: 195_000, color: '#86C1A5' },
  { categoria: 'Otros', monto: 270_000, color: '#FFDAB9' },
];

// ─── Mock Recent Journal Entries ───────────────────────────────────
const mockJournalEntries: JournalEntry[] = [
  {
    id: 'je-001',
    companyId: 'comp-1',
    periodId: 'per-12',
    entryNumber: 'POL-2025-0142',
    description: 'Pago de nómina quincenal Diciembre',
    entryDate: '2025-12-15',
    entryType: 'EGRESO',
    status: 'POSTED',
    totalDebit: 185_000,
    totalCredit: 185_000,
    difference: 0,
    lines: [],
    createdBy: 'María García',
    postedAt: '2025-12-15T10:30:00Z',
    createdAt: '2025-12-15T09:00:00Z',
    updatedAt: '2025-12-15T10:30:00Z',
  },
  {
    id: 'je-002',
    companyId: 'comp-1',
    periodId: 'per-12',
    entryNumber: 'POL-2025-0141',
    description: 'Cobro de cliente Grupo Alfa S.A.',
    entryDate: '2025-12-14',
    entryType: 'INGRESO',
    status: 'POSTED',
    totalDebit: 95_400,
    totalCredit: 95_400,
    difference: 0,
    lines: [],
    createdBy: 'Carlos López',
    postedAt: '2025-12-14T16:00:00Z',
    createdAt: '2025-12-14T15:30:00Z',
    updatedAt: '2025-12-14T16:00:00Z',
  },
  {
    id: 'je-003',
    companyId: 'comp-1',
    periodId: 'per-12',
    entryNumber: 'POL-2025-0140',
    description: 'Provisión de impuesto ISR Diciembre',
    entryDate: '2025-12-13',
    entryType: 'DIARIO',
    status: 'DRAFT',
    totalDebit: 42_500,
    totalCredit: 42_500,
    difference: 0,
    lines: [],
    createdBy: 'María García',
    createdAt: '2025-12-13T11:00:00Z',
    updatedAt: '2025-12-13T11:00:00Z',
  },
  {
    id: 'je-004',
    companyId: 'comp-1',
    periodId: 'per-12',
    entryNumber: 'POL-2025-0139',
    description: 'Depreciación mensual equipo de cómputo',
    entryDate: '2025-12-10',
    entryType: 'DIARIO',
    status: 'POSTED',
    totalDebit: 12_800,
    totalCredit: 12_800,
    difference: 0,
    lines: [],
    createdBy: 'Ana Martínez',
    postedAt: '2025-12-10T14:20:00Z',
    createdAt: '2025-12-10T14:00:00Z',
    updatedAt: '2025-12-10T14:20:00Z',
  },
  {
    id: 'je-005',
    companyId: 'comp-1',
    periodId: 'per-12',
    entryNumber: 'POL-2025-0138',
    description: 'Compra de insumos de oficina Papelería MX',
    entryDate: '2025-12-09',
    entryType: 'EGRESO',
    status: 'POSTED',
    totalDebit: 8_750,
    totalCredit: 8_750,
    difference: 0,
    lines: [],
    createdBy: 'Carlos López',
    postedAt: '2025-12-09T17:00:00Z',
    createdAt: '2025-12-09T16:30:00Z',
    updatedAt: '2025-12-09T17:00:00Z',
  },
];

// ─── Mock Recent Invoices ──────────────────────────────────────────
const mockInvoices: Invoice[] = [
  {
    id: 'inv-001',
    companyId: 'comp-1',
    thirdPartyId: 'tp-01',
    thirdParty: { id: 'tp-01', companyId: 'comp-1', name: 'Grupo Alfa S.A. de C.V.', taxId: 'GAL180123AB5', type: 'CLIENT', balance: 125_000, isActive: true, createdAt: '2025-01-15T00:00:00Z' },
    invoiceNumber: 'FC-2025-0089',
    invoiceType: 'SALE',
    description: 'Servicios de contabilidad Diciembre',
    invoiceDate: '2025-12-14',
    dueDate: '2026-01-14',
    status: 'PAID',
    subtotal: 80_000,
    taxAmount: 12_800,
    totalAmount: 92_800,
    balanceDue: 0,
    lines: [],
    taxEntries: [],
    paymentSchedule: [],
    createdAt: '2025-12-14T10:00:00Z',
  },
  {
    id: 'inv-002',
    companyId: 'comp-1',
    thirdPartyId: 'tp-02',
    thirdParty: { id: 'tp-02', companyId: 'comp-1', name: 'Constructora del Norte S.A.', taxId: 'CDN200456XY7', type: 'CLIENT', balance: 210_000, isActive: true, createdAt: '2025-02-20T00:00:00Z' },
    invoiceNumber: 'FC-2025-0088',
    invoiceType: 'SALE',
    description: 'Auditoría financiera Q4 2025',
    invoiceDate: '2025-12-12',
    dueDate: '2026-01-12',
    status: 'PENDING',
    subtotal: 150_000,
    taxAmount: 24_000,
    totalAmount: 174_000,
    balanceDue: 174_000,
    lines: [],
    taxEntries: [],
    paymentSchedule: [],
    createdAt: '2025-12-12T09:30:00Z',
  },
  {
    id: 'inv-003',
    companyId: 'comp-1',
    thirdPartyId: 'tp-03',
    thirdParty: { id: 'tp-03', companyId: 'comp-1', name: 'Distribuidora del Pacífico', taxId: 'DPA190789KL3', type: 'CLIENT', balance: 85_000, isActive: true, createdAt: '2025-03-10T00:00:00Z' },
    invoiceNumber: 'FC-2025-0087',
    invoiceType: 'SALE',
    description: 'Asesoría fiscal trimestral',
    invoiceDate: '2025-12-10',
    dueDate: '2025-12-25',
    status: 'OVERDUE',
    subtotal: 35_000,
    taxAmount: 5_600,
    totalAmount: 40_600,
    balanceDue: 40_600,
    lines: [],
    taxEntries: [],
    paymentSchedule: [],
    createdAt: '2025-12-10T11:00:00Z',
  },
  {
    id: 'inv-004',
    companyId: 'comp-1',
    thirdPartyId: 'tp-04',
    thirdParty: { id: 'tp-04', companyId: 'comp-1', name: 'Tech Solutions MX', taxId: 'TSM210523MN8', type: 'SUPPLIER', balance: 45_000, isActive: true, createdAt: '2025-04-05T00:00:00Z' },
    invoiceNumber: 'FC-2025-0086',
    invoiceType: 'PURCHASE',
    description: 'Licencias de software contable',
    invoiceDate: '2025-12-08',
    dueDate: '2026-01-08',
    status: 'PAID',
    subtotal: 25_000,
    taxAmount: 4_000,
    totalAmount: 29_000,
    balanceDue: 0,
    lines: [],
    taxEntries: [],
    paymentSchedule: [],
    createdAt: '2025-12-08T14:00:00Z',
  },
  {
    id: 'inv-005',
    companyId: 'comp-1',
    thirdPartyId: 'tp-05',
    thirdParty: { id: 'tp-05', companyId: 'comp-1', name: 'Inmobiliaria Los Pinos', taxId: 'ILP220834QR1', type: 'CLIENT', balance: 320_000, isActive: true, createdAt: '2025-01-20T00:00:00Z' },
    invoiceNumber: 'FC-2025-0085',
    invoiceType: 'SALE',
    description: 'Servicios de contabilidad Noviembre',
    invoiceDate: '2025-12-05',
    dueDate: '2025-12-20',
    status: 'PARTIAL',
    subtotal: 65_000,
    taxAmount: 10_400,
    totalAmount: 75_400,
    balanceDue: 37_700,
    lines: [],
    taxEntries: [],
    paymentSchedule: [],
    createdAt: '2025-12-05T08:30:00Z',
  },
];

// ─── Mock Top Clients ──────────────────────────────────────────────
const mockTopClients: TopClientItem[] = [
  {
    id: 'tc-01',
    nombre: 'Constructora del Norte S.A.',
    totalFacturado: 680_000,
    facturasPagadas: 8,
    facturasPendientes: 2,
    initials: 'CN',
    color: '#FFB6C1',
  },
  {
    id: 'tc-02',
    nombre: 'Inmobiliaria Los Pinos',
    totalFacturado: 545_000,
    facturasPagadas: 6,
    facturasPendientes: 3,
    initials: 'IL',
    color: '#E6E6FA',
  },
  {
    id: 'tc-03',
    nombre: 'Grupo Alfa S.A. de C.V.',
    totalFacturado: 420_000,
    facturasPagadas: 5,
    facturasPendientes: 0,
    initials: 'GA',
    color: '#86C1A5',
  },
  {
    id: 'tc-04',
    nombre: 'Distribuidora del Pacífico',
    totalFacturado: 310_000,
    facturasPagadas: 4,
    facturasPendientes: 1,
    initials: 'DP',
    color: '#F5E6D3',
  },
  {
    id: 'tc-05',
    nombre: 'Alimentos del Sur S.A.',
    totalFacturado: 275_000,
    facturasPagadas: 3,
    facturasPendientes: 1,
    initials: 'AS',
    color: '#FFDAB9',
  },
];

// ─── Hook ──────────────────────────────────────────────────────────
export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data (simulates API with 800ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const dashboardData: DashboardData = {
          kpis: mockKPIs,
          revenueTrend: mockRevenueTrend,
          expenseCategories: mockExpenseCategories,
          recentJournalEntries: mockJournalEntries,
          recentInvoices: mockInvoices,
          topClients: mockTopClients,
        };
        setData(dashboardData);
        setIsLoading(false);
      } catch {
        setError('Error al cargar los datos del panel');
        setIsLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    const timer = setTimeout(() => {
      try {
        const dashboardData: DashboardData = {
          kpis: mockKPIs,
          revenueTrend: mockRevenueTrend,
          expenseCategories: mockExpenseCategories,
          recentJournalEntries: mockJournalEntries,
          recentInvoices: mockInvoices,
          topClients: mockTopClients,
        };
        setData(dashboardData);
        setIsLoading(false);
      } catch {
        setError('Error al cargar los datos del panel');
        setIsLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
