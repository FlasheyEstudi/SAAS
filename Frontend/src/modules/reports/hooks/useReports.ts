'use client';

import { useState, useEffect } from 'react';
import type { TrialBalanceEntry, BalanceSheetResponse, IncomeStatementResponse } from '@/lib/api/types';

// ── Mock Trial Balance Data ───────────────────────────────────────────
const mockTrialBalance: TrialBalanceEntry[] = [
  // Assets (1000-1999)
  { accountId: 'a-1', accountCode: '1000', accountName: 'Caja y Bancos', accountType: 'ASSET', debitBalance: 2055000, creditBalance: 0, netBalance: 2055000 },
  { accountId: 'a-2', accountCode: '1100', accountName: 'Bancos - BBVA', accountType: 'ASSET', debitBalance: 1250000, creditBalance: 0, netBalance: 1250000 },
  { accountId: 'a-3', accountCode: '1101', accountName: 'Bancos - Banorte', accountType: 'ASSET', debitBalance: 850000, creditBalance: 0, netBalance: 850000 },
  { accountId: 'a-4', accountCode: '1200', accountName: 'Cuentas por Cobrar', accountType: 'ASSET', debitBalance: 450000, creditBalance: 0, netBalance: 450000 },
  { accountId: 'a-5', accountCode: '1300', accountName: 'Inventarios', accountType: 'ASSET', debitBalance: 320000, creditBalance: 0, netBalance: 320000 },
  { accountId: 'a-6', accountCode: '1500', accountName: 'Propiedades, Planta y Equipo', accountType: 'ASSET', debitBalance: 1800000, creditBalance: 0, netBalance: 1800000 },
  { accountId: 'a-7', accountCode: '1510', accountName: 'Depreciación Acumulada', accountType: 'ASSET', debitBalance: 0, creditBalance: 420000, netBalance: -420000 },
  { accountId: 'a-8', accountCode: '1600', accountName: 'Gastos Pagados por Anticipado', accountType: 'ASSET', debitBalance: 85000, creditBalance: 0, netBalance: 85000 },
  // Liabilities (2000-2999)
  { accountId: 'a-9', accountCode: '2000', accountName: 'Cuentas por Pagar', accountType: 'LIABILITY', debitBalance: 0, creditBalance: 280000, netBalance: -280000 },
  { accountId: 'a-10', accountCode: '2100', accountName: 'Impuestos por Pagar - ISR', accountType: 'LIABILITY', debitBalance: 0, creditBalance: 185000, netBalance: -185000 },
  { accountId: 'a-11', accountCode: '2110', accountName: 'Impuestos por Pagar - IVA', accountType: 'LIABILITY', debitBalance: 0, creditBalance: 96000, netBalance: -96000 },
  { accountId: 'a-12', accountCode: '2200', accountName: 'Préstamos Bancarios', accountType: 'LIABILITY', debitBalance: 0, creditBalance: 750000, netBalance: -750000 },
  { accountId: 'a-13', accountCode: '2300', accountName: 'Acreedores Diversos', accountType: 'LIABILITY', debitBalance: 0, creditBalance: 65000, netBalance: -65000 },
  // Equity (3000-3999)
  { accountId: 'a-14', accountCode: '3000', accountName: 'Capital Social', accountType: 'EQUITY', debitBalance: 0, creditBalance: 2500000, netBalance: -2500000 },
  { accountId: 'a-15', accountCode: '3100', accountName: 'Reserva Legal', accountType: 'EQUITY', debitBalance: 0, creditBalance: 250000, netBalance: -250000 },
  { accountId: 'a-16', accountCode: '3200', accountName: 'Utilidades Retenidas', accountType: 'EQUITY', debitBalance: 0, creditBalance: 380000, netBalance: -380000 },
  { accountId: 'a-17', accountCode: '3300', accountName: 'Resultado del Ejercicio', accountType: 'EQUITY', debitBalance: 0, creditBalance: 0, netBalance: 0 },
  // Income (4000-4999)
  { accountId: 'a-18', accountCode: '4000', accountName: 'Ingresos por Servicios', accountType: 'INCOME', debitBalance: 0, creditBalance: 1850000, netBalance: -1850000 },
  { accountId: 'a-19', accountCode: '4100', accountName: 'Ingresos por Ventas', accountType: 'INCOME', debitBalance: 0, creditBalance: 650000, netBalance: -650000 },
  { accountId: 'a-20', accountCode: '4200', accountName: 'Otros Ingresos', accountType: 'INCOME', debitBalance: 0, creditBalance: 85000, netBalance: -85000 },
  // Expenses (5000-5999)
  { accountId: 'a-21', accountCode: '5000', accountName: 'Costo de Ventas', accountType: 'EXPENSE', debitBalance: 620000, creditBalance: 0, netBalance: 620000 },
  { accountId: 'a-22', accountCode: '5100', accountName: 'Gastos de Nómina', accountType: 'EXPENSE', debitBalance: 540000, creditBalance: 0, netBalance: 540000 },
  { accountId: 'a-23', accountCode: '5110', accountName: 'IMSS y Prestaciones', accountType: 'EXPENSE', debitBalance: 162000, creditBalance: 0, netBalance: 162000 },
  { accountId: 'a-24', accountCode: '5200', accountName: 'Gastos de Oficina', accountType: 'EXPENSE', debitBalance: 85000, creditBalance: 0, netBalance: 85000 },
  { accountId: 'a-25', accountCode: '5300', accountName: 'Arrendamiento', accountType: 'EXPENSE', debitBalance: 180000, creditBalance: 0, netBalance: 180000 },
  { accountId: 'a-26', accountCode: '5400', accountName: 'Depreciación', accountType: 'EXPENSE', debitBalance: 140000, creditBalance: 0, netBalance: 140000 },
  { accountId: 'a-27', accountCode: '5500', accountName: 'Servicios Profesionales', accountType: 'EXPENSE', debitBalance: 120000, creditBalance: 0, netBalance: 120000 },
  { accountId: 'a-28', accountCode: '5600', accountName: 'Gastos de Servicios', accountType: 'EXPENSE', debitBalance: 45000, creditBalance: 0, netBalance: 45000 },
];

// ── Mock Balance Sheet ────────────────────────────────────────────────
const mockBalanceSheet: BalanceSheetResponse = {
  totalAssets: 4290000,
  totalLiabilities: 1376000,
  totalEquity: 3130000,
  assets: [
    { name: 'Activo Circulante', amount: 2905000, subItems: [
      { name: 'Caja y Bancos', amount: 2055000 },
      { name: 'Cuentas por Cobrar', amount: 450000 },
      { name: 'Inventarios', amount: 320000 },
      { name: 'Gastos Pagados por Anticipado', amount: 85000 },
    ]},
    { name: 'Activo Fijo', amount: 1385000, subItems: [
      { name: 'Propiedades, Planta y Equipo', amount: 1800000 },
      { name: '(-) Depreciación Acumulada', amount: -420000 },
    ]},
  ],
  liabilities: [
    { name: 'Pasivo Circulante', amount: 626000, subItems: [
      { name: 'Cuentas por Pagar', amount: 280000 },
      { name: 'ISR por Pagar', amount: 185000 },
      { name: 'IVA por Pagar', amount: 96000 },
      { name: 'Acreedores Diversos', amount: 65000 },
    ]},
    { name: 'Pasivo a Largo Plazo', amount: 750000, subItems: [
      { name: 'Préstamos Bancarios', amount: 750000 },
    ]},
  ],
  equity: [
    { name: 'Capital', amount: 2500000, subItems: [
      { name: 'Capital Social', amount: 2500000 },
    ]},
    { name: 'Reservas y Utilidades', amount: 630000, subItems: [
      { name: 'Reserva Legal', amount: 250000 },
      { name: 'Utilidades Retenidas', amount: 380000 },
    ]},
  ],
};

// ── Mock Income Statement ─────────────────────────────────────────────
const mockIncomeStatement: IncomeStatementResponse = {
  totalIncome: 2585000,
  totalExpenses: 1892000,
  netIncome: 693000,
  grossProfit: 1965000,
  operatingExpenses: 1272000,
  incomeDetails: [
    { name: 'Ingresos por Servicios', amount: 1850000 },
    { name: 'Ingresos por Ventas', amount: 650000 },
    { name: 'Otros Ingresos', amount: 85000 },
  ],
  expenseDetails: [
    { name: 'Costo de Ventas', amount: 620000 },
    { name: 'Gastos de Nómina', amount: 540000 },
    { name: 'IMSS y Prestaciones', amount: 162000 },
    { name: 'Gastos de Oficina', amount: 85000 },
    { name: 'Arrendamiento', amount: 180000 },
    { name: 'Depreciación', amount: 140000 },
    { name: 'Servicios Profesionales', amount: 120000 },
    { name: 'Gastos de Servicios', amount: 45000 },
  ],
};

// ── Hook ──────────────────────────────────────────────────────────────
export function useReports() {
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('2025-12');
  const [year, setYear] = useState('2025');

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const trialBalance = mockTrialBalance;
  const balanceSheet = mockBalanceSheet;
  const incomeStatement = mockIncomeStatement;

  // Trial balance summary
  const totalDebit = trialBalance.reduce((s, e) => s + e.debitBalance, 0);
  const totalCredit = trialBalance.reduce((s, e) => s + e.creditBalance, 0);

  return {
    isLoading,
    period,
    setPeriod,
    year,
    setYear,
    trialBalance,
    balanceSheet,
    incomeStatement,
    totalDebit,
    totalCredit,
  };
}
