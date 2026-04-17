"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { ACCOUNTS } from '@/lib/api/endpoints';
import type { Account } from '@/lib/api/types';
import { toast } from 'sonner';

export function useAccounts() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<{ accounts: Account[] }>({
    queryKey: ['accounts', 'tree'],
    queryFn: () => apiClient.get<{ accounts: Account[] }>(ACCOUNTS.tree),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (newAccount: Partial<Account>) => 
      apiClient.post(ACCOUNTS.list, newAccount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', 'tree'] });
      toast.success('Cuenta creada exitosamente');
    },
    onError: (err: any) => {
      toast.error(err.error || 'Error al crear la cuenta');
    }
  });

  return {
    accounts: Array.isArray(data) ? data : data?.accounts || [],
    isLoading,
    error: error ? (error as any).error || 'Error fetching accounts' : null,
    refetch,
    createAccount: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
