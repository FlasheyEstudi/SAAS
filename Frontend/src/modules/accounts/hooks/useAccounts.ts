"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { ACCOUNTS } from '@/lib/api/endpoints';
import type { Account } from '@/lib/api/types';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/stores/useAppStore';

export function useAccounts() {
  const queryClient = useQueryClient();
  const currentCompany = useAppStore(s => s.currentCompany);
  const companyId = currentCompany?.id;

  const { data, isLoading, error, refetch } = useQuery<any>({
    queryKey: ['accounts', 'tree', companyId],
    queryFn: () => apiClient.get<any>(`${ACCOUNTS.tree}?companyId=${companyId || ''}`),
    retry: false,
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Account>) => 
      apiClient.post(ACCOUNTS.list, { ...data, companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Cuenta creada correctamente');
    },
    onError: (err: any) => toast.error(err.error || 'Error al crear la cuenta'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Account> }) => 
      apiClient.put(ACCOUNTS.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Cuenta actualizada correctamente');
    },
    onError: (err: any) => toast.error(err.error || 'Error al actualizar cuenta'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(ACCOUNTS.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Cuenta eliminada correctamente');
    },
    onError: (err: any) => toast.error(err.error || 'Error al eliminar cuenta'),
  });

  // Extract accounts safely
  const accounts = Array.isArray(data?.data?.data) 
    ? data.data.data 
    : (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (data as any)?.accounts || []));

  return {
    accounts: accounts as Account[],
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
