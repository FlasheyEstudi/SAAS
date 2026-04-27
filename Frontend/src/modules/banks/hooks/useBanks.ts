'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { BANKS, RECONCILIATION } from '@/lib/api/endpoints';
import type { BankAccount, BankMovement } from '@/lib/api/types';

export interface CreateBankAccountData {
  name: string;
  accountNumber: string;
  bankName: string;
  initialBalance: number;
  currency: string;
}

/**
 * Hook for banks - consumes real Backend APIs
 */
export function useBanks() {
  const queryClient = useQueryClient();

  // Filtering and pagination state
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Fetch bank accounts list
  const { data: banksData, isLoading: banksLoading, error: banksError } = useQuery<{ data: BankAccount[] }>({
    queryKey: ['bank-accounts', 'list'],
    queryFn: () => apiClient.get<{ data: BankAccount[] }>(BANKS.list),
    retry: false,
  });

  // Fetch bank movements
  const { data: movementsData, isLoading: movementsLoading } = useQuery<any>({
    queryKey: ['bank-movements', 'list', { search, accountFilter, typeFilter, page, limit }],
    queryFn: () => {
      const companyId = localStorage.getItem('current_company_id');
      return apiClient.get(BANKS.movements.list, { 
        companyId: companyId || undefined,
        search: search || undefined,
        bankAccountId: accountFilter || undefined,
        movementType: typeFilter || undefined,
        page,
        limit
      });
    },
    retry: false,
  });

  const clearFilters = () => {
    setSearch('');
    setAccountFilter('');
    setTypeFilter('');
    setPage(1);
  };

  // Create bank account mutation
  const createAccountMutation = useMutation({
    mutationFn: (data: CreateBankAccountData) => apiClient.post<BankAccount>(BANKS.create, { ...data, companyId: localStorage.getItem('current_company_id') }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });

  // Update bank account mutation
  const updateAccountMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBankAccountData> }) =>
      apiClient.put<BankAccount>(BANKS.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });

  // Delete bank account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(BANKS.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });

  // Create movement mutation
  const createMovementMutation = useMutation({
    mutationFn: (data: any) => {
      // Map frontend types to backend types
      const mappedType = data.movementType === 'DEPOSIT' ? 'CREDIT' : 
                         data.movementType === 'WITHDRAWAL' ? 'DEBIT' : 
                         data.movementType;
      
      const payload = {
        ...data,
        movementType: mappedType,
        movementDate: data.date || data.movementDate,
      };
      delete payload.date;
      
      return apiClient.post<BankMovement>(BANKS.movements.create, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-movements'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });

  // Reconcile movements for an account (Auto-match logic)
  const reconcileMutation = useMutation({
    mutationFn: (bankAccountId: string) =>
      apiClient.post<any>(BANKS.movements.reconcile, { bankAccountId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-movements'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });

  // Auto-match reconciliation
  const autoMatchMutation = useMutation({
    mutationFn: (bankAccountId: string) => apiClient.post(RECONCILIATION.autoMatch, { bankAccountId }),
  });

  const movements = Array.isArray(movementsData) ? movementsData : (movementsData?.data || []);
  const total = movementsData?.total || movements.length;
  const totalPages = movementsData?.totalPages || 1;

  return {
    bankAccounts: banksData?.data || [],
    movements,
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
    isLoading: banksLoading || movementsLoading,
    error: banksError,
    createAccount: createAccountMutation.mutateAsync,
    updateAccount: updateAccountMutation.mutateAsync,
    deleteAccount: deleteAccountMutation.mutateAsync,
    createMovement: createMovementMutation.mutateAsync,
    reconcileMovement: reconcileMutation.mutateAsync,
    autoMatch: autoMatchMutation.mutateAsync,
    isCreatingAccount: createAccountMutation.isPending,
    isUpdatingAccount: updateAccountMutation.isPending,
    isDeletingAccount: deleteAccountMutation.isPending,
    isCreatingMovement: createMovementMutation.isPending,
    isReconciling: reconcileMutation.isPending,
  };
}
