'use client';

import { useState, useCallback, useEffect } from 'react';
import type { BankAccount, BankMovement } from '@/lib/api/types';

// ── Mock Bank Accounts ────────────────────────────────────────────────
const mockAccounts: BankAccount[] = [
  { id: 'ba-1', companyId: 'c-1', bankName: 'BBVA México', accountNumber: '**** **** **** 4521', accountType: 'CHECKING', currency: 'MXN', currentBalance: 1250000, isActive: true, createdAt: '2025-01-10T10:00:00Z' },
  { id: 'ba-2', companyId: 'c-1', bankName: 'Banorte', accountNumber: '**** **** **** 7834', accountType: 'SAVINGS', currency: 'MXN', currentBalance: 850000, isActive: true, createdAt: '2025-02-20T10:00:00Z' },
  { id: 'ba-3', companyId: 'c-1', bankName: 'Santander', accountNumber: '**** **** **** 2156', accountType: 'CHECKING', currency: 'MXN', currentBalance: -45000, isActive: true, createdAt: '2025-03-05T10:00:00Z' },
  { id: 'ba-4', companyId: 'c-1', bankName: 'Citibanamex', accountNumber: '**** **** **** 9087', accountType: 'CREDIT', currency: 'MXN', currentBalance: -320000, isActive: true, createdAt: '2025-04-15T10:00:00Z' },
];

// ── Mock Movements ────────────────────────────────────────────────────
const mockMovements: BankMovement[] = [
  { id: 'mv-1', bankAccountId: 'ba-1', description: 'Cobro factura CFE-2025-0001 - Constructora Hernández', amount: 116000, movementType: 'DEPOSIT', reference: 'TRF-001234', movementDate: '2025-10-28T00:00:00Z', reconciled: true, createdAt: '2025-10-28T10:00:00Z' },
  { id: 'mv-2', bankAccountId: 'ba-1', description: 'Pago nómina quincenal - Octubre 2da quincena', amount: -285000, movementType: 'WITHDRAWAL', reference: 'NOM-2025-20', movementDate: '2025-10-31T00:00:00Z', reconciled: true, createdAt: '2025-10-31T10:00:00Z' },
  { id: 'mv-3', bankAccountId: 'ba-1', description: 'Cobro factura CFE-2025-0006 - Automotriz del Bajío', amount: 87000, movementType: 'DEPOSIT', reference: 'TRF-001256', movementDate: '2025-11-15T00:00:00Z', reconciled: true, createdAt: '2025-11-15T10:00:00Z' },
  { id: 'mv-4', bankAccountId: 'ba-1', description: 'Pago servicio de internet y telefonía', amount: -12500, movementType: 'WITHDRAWAL', reference: 'TEL-112025', movementDate: '2025-11-01T00:00:00Z', reconciled: true, createdAt: '2025-11-01T10:00:00Z' },
  { id: 'mv-5', bankAccountId: 'ba-1', description: 'Transferencia a cuenta de ahorros Banorte', amount: -200000, movementType: 'TRANSFER', reference: 'TRF-INT-001', movementDate: '2025-11-05T00:00:00Z', reconciled: false, createdAt: '2025-11-05T10:00:00Z' },
  { id: 'mv-6', bankAccountId: 'ba-2', description: 'Depósito de transferencia desde BBVA', amount: 200000, movementType: 'DEPOSIT', reference: 'TRF-INT-001', movementDate: '2025-11-05T00:00:00Z', reconciled: false, createdAt: '2025-11-05T10:00:00Z' },
  { id: 'mv-7', bankAccountId: 'ba-2', description: 'Intereses ganados - Noviembre', amount: 3200, movementType: 'DEPOSIT', reference: 'INT-112025', movementDate: '2025-11-30T00:00:00Z', reconciled: false, createdAt: '2025-11-30T10:00:00Z' },
  { id: 'mv-8', bankAccountId: 'ba-2', description: 'Retiro parcial para fondo de emergencia', amount: -50000, movementType: 'WITHDRAWAL', reference: 'RET-001', movementDate: '2025-11-20T00:00:00Z', reconciled: false, createdAt: '2025-11-20T10:00:00Z' },
  { id: 'mv-9', bankAccountId: 'ba-2', description: 'Depósito de renta de oficina - Noviembre', amount: 65000, movementType: 'DEPOSIT', reference: 'RNT-112025', movementDate: '2025-11-01T00:00:00Z', reconciled: true, createdAt: '2025-11-01T10:00:00Z' },
  { id: 'mv-10', bankAccountId: 'ba-3', description: 'Pago proveedor Distribuidora Nacional', amount: -52200, movementType: 'WITHDRAWAL', reference: 'PROV-001', movementDate: '2025-10-30T00:00:00Z', reconciled: true, createdAt: '2025-10-30T10:00:00Z' },
  { id: 'mv-11', bankAccountId: 'ba-3', description: 'Pago arrendamiento copiadora', amount: -8500, movementType: 'WITHDRAWAL', reference: 'ARR-001', movementDate: '2025-11-01T00:00:00Z', reconciled: true, createdAt: '2025-11-01T10:00:00Z' },
  { id: 'mv-12', bankAccountId: 'ba-3', description: 'Cobro factura CFE-2025-0004 - TechSoft Solutions', amount: 110200, movementType: 'DEPOSIT', reference: 'TRF-001300', movementDate: '2025-11-18T00:00:00Z', reconciled: false, createdAt: '2025-11-18T10:00:00Z' },
  { id: 'mv-13', bankAccountId: 'ba-4', description: 'Pago de tarjeta - Equipo de cómputo OSN', amount: -60320, movementType: 'WITHDRAWAL', reference: 'TAR-112025', movementDate: '2025-11-15T00:00:00Z', reconciled: false, createdAt: '2025-11-15T10:00:00Z' },
  { id: 'mv-14', bankAccountId: 'ba-4', description: 'Pago de tarjeta - Suscripciones de software', amount: -18500, movementType: 'WITHDRAWAL', reference: 'TAR-112025-02', movementDate: '2025-11-05T00:00:00Z', reconciled: false, createdAt: '2025-11-05T10:00:00Z' },
  { id: 'mv-15', bankAccountId: 'ba-4', description: 'Cargo anual de membresía corporativa', amount: -15000, movementType: 'WITHDRAWAL', reference: 'TAR-ANUAL', movementDate: '2025-11-01T00:00:00Z', reconciled: false, createdAt: '2025-11-01T10:00:00Z' },
];

// ── Delay helper ──────────────────────────────────────────────────────
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Hook ──────────────────────────────────────────────────────────────
export function useBanks() {
  const [accounts, setAccounts] = useState<BankAccount[]>(mockAccounts);
  const [movements, setMovements] = useState<BankMovement[]>(mockMovements);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  // Filtered movements
  const filteredMovements = movements.filter((mv) => {
    const searchLower = search.toLowerCase();
    const matchSearch = !search || mv.description.toLowerCase().includes(searchLower) || (mv.reference ?? '').toLowerCase().includes(searchLower);
    const matchAccount = !accountFilter || mv.bankAccountId === accountFilter;
    const matchType = !typeFilter || mv.movementType === typeFilter;
    return matchSearch && matchAccount && matchType;
  });

  const total = filteredMovements.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginatedMovements = filteredMovements.slice((page - 1) * limit, page * limit);

  // Sort by date descending
  const sortedMovements = [...paginatedMovements].sort(
    (a, b) => new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime(),
  );

  const clearFilters = () => {
    setSearch('');
    setAccountFilter('');
    setTypeFilter('');
    setPage(1);
  };

  const createMovement = useCallback(
    async (data: {
      bankAccountId: string;
      description: string;
      amount: number;
      movementType: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
      reference?: string;
      movementDate: string;
    }): Promise<BankMovement | null> => {
      await delay(500);
      const account = accounts.find((a) => a.id === data.bankAccountId);
      const newMovement: BankMovement = {
        id: `mv-${Date.now()}`,
        bankAccountId: data.bankAccountId,
        bankAccount: account,
        description: data.description,
        amount: data.movementType === 'WITHDRAWAL' ? -Math.abs(data.amount) : Math.abs(data.amount),
        movementType: data.movementType,
        reference: data.reference,
        movementDate: data.movementDate,
        reconciled: false,
        createdAt: new Date().toISOString(),
      };
      setMovements((prev) => [newMovement, ...prev]);

      // Update account balance
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === data.bankAccountId
            ? { ...acc, currentBalance: acc.currentBalance + newMovement.amount }
            : acc,
        ),
      );

      return newMovement;
    },
    [accounts],
  );

  const reconcileMovement = useCallback(async (id: string): Promise<boolean> => {
    await delay(500);
    let success = false;
    setMovements((prev) =>
      prev.map((mv) => {
        if (mv.id !== id) return mv;
        success = true;
        return { ...mv, reconciled: true };
      }),
    );
    return success;
  }, []);

  // Summary stats
  const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);
  const totalDeposits = movements.filter((m) => m.movementType === 'DEPOSIT').reduce((s, m) => s + m.amount, 0);
  const totalWithdrawals = movements.filter((m) => m.movementType === 'WITHDRAWAL').reduce((s, m) => s + Math.abs(m.amount), 0);
  const totalTransfers = movements.filter((m) => m.movementType === 'TRANSFER').reduce((s, m) => s + Math.abs(m.amount), 0);

  return {
    accounts,
    movements: sortedMovements,
    isLoading,
    total,
    totalPages,
    page,
    limit,
    search,
    accountFilter,
    typeFilter,
    setSearch,
    setAccountFilter,
    setTypeFilter,
    setPage,
    clearFilters,
    createMovement,
    reconcileMovement,
    totalBalance,
    totalDeposits,
    totalWithdrawals,
    totalTransfers,
  };
}
