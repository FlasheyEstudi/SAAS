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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Account> }) => 
      apiClient.put(ACCOUNTS.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', 'tree'] });
      toast.success('Cuenta actualizada correctamente');
    },
    onError: (err: any) => toast.error(err.error || 'Error al actualizar cuenta'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(ACCOUNTS.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', 'tree'] });
      toast.success('Cuenta eliminada correctamente');
    },
    onError: (err: any) => toast.error(err.error || 'Error al eliminar cuenta'),
  });

  return {
    accounts: Array.isArray(data) ? data : data?.accounts || [],
    isLoading,
    error: error ? (error as any).error || 'Error fetching accounts' : null,
    refetch,
    createAccount: createMutation.mutateAsync,
    updateAccount: updateMutation.mutateAsync,
    deleteAccount: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
