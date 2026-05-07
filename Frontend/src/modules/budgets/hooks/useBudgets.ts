"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { BUDGETS } from '@/lib/api/endpoints';
import type { Budget } from '@/lib/api/types';
import { useAppStore } from '@/lib/stores/useAppStore';
import { toast } from 'sonner';

export function useBudgets() {
  const queryClient = useQueryClient();
  const currentCompany = useAppStore(s => s.currentCompany);
  const companyId = currentCompany?.id;

  const { data, isLoading, error, refetch } = useQuery<any>({
    queryKey: ['budgets', 'list', companyId],
    queryFn: () => apiClient.get<any>(`${BUDGETS.list}?companyId=${companyId || ''}`),
    retry: false,
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (newBudget: Partial<Budget>) => 
      apiClient.post(BUDGETS.list, { ...newBudget, companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Presupuesto creado con éxito');
    },
    onError: (err: any) => {
      toast.error(err.error || 'Error al crear el presupuesto');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Budget> }) => 
      apiClient.put(BUDGETS.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Presupuesto actualizado correctamente');
    },
    onError: (err: any) => {
      toast.error(err.error || 'Error al actualizar el presupuesto');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(BUDGETS.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Presupuesto eliminado correctamente');
    },
    onError: (err: any) => {
      toast.error(err.error || 'Error al eliminar el presupuesto');
    }
  });

  // Extract budgets safely
  const budgets = Array.isArray(data?.data?.data) 
    ? data.data.data 
    : (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (data as any)?.budgets || []));

  return {
    budgets: budgets as Budget[],
    isLoading,
    error: error ? (error as any).error || 'Error fetching budgets' : null,
    refetch,
    createBudget: createMutation.mutateAsync,
    updateBudget: updateMutation.mutateAsync,
    deleteBudget: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
