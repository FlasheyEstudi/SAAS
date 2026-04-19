'use client';

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

export interface CreateMovementData {
  bankAccountId: string;
  description: string;
  amount: number;
  movementType: string;
  date: string;
  reference?: string;
}

/**
 * Hook for banks - consumes real Backend APIs
 */
export function useBanks() {
  const queryClient = useQueryClient();

  // Fetch bank accounts list
  const { data: banksData, isLoading: banksLoading, error: banksError } = useQuery<{ data: BankAccount[] }>({
    queryKey: ['bank-accounts', 'list'],
    queryFn: () => apiClient.get<{ data: BankAccount[] }>(BANKS.list),
    retry: false,
  });

  // Fetch bank movements
  const { data: movementsData, isLoading: movementsLoading } = useQuery<{ data: BankMovement[] }>({
    queryKey: ['bank-movements', 'list'],
    queryFn: () => apiClient.get<{ data: BankMovement[] }>(BANKS.movements.list),
    retry: false,
  });

  // Create bank account mutation
  const createAccountMutation = useMutation({
    mutationFn: (data: CreateBankAccountData) => apiClient.post<BankAccount>(BANKS.create, data),
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
    mutationFn: (data: CreateMovementData) => apiClient.post<BankMovement>(BANKS.movements.create, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-movements'] });
    },
  });

  // Reconcile movement mutation
  const reconcileMutation = useMutation({
    mutationFn: ({ movementId, journalEntryId }: { movementId: string; journalEntryId: string }) =>
      apiClient.post<BankMovement>(BANKS.movements.reconcile, { movementId, journalEntryId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-movements'] });
    },
  });

  // Auto-match reconciliation
  const autoMatchMutation = useMutation({
    mutationFn: (bankAccountId: string) => apiClient.post(RECONCILIATION.autoMatch, { bankAccountId }),
  });

  return {
    bankAccounts: banksData?.data || [],
    movements: movementsData?.data || [],
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
