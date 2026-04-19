"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { BUDGETS } from '@/lib/api/endpoints';
import type { Budget } from '@/lib/api/types';
import { toast } from 'sonner';

export function useBudgets() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<{ budgets: Budget[] }>({
    queryKey: ['budgets', 'list'],
    queryFn: () => apiClient.get<{ budgets: Budget[] }>(BUDGETS.list),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (newBudget: Partial<Budget>) => 
      apiClient.post(BUDGETS.list, newBudget),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', 'list'] });
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
      queryClient.invalidateQueries({ queryKey: ['budgets', 'list'] });
      toast.success('Presupuesto actualizado correctamente');
    },
    onError: (err: any) => {
      toast.error(err.error || 'Error al actualizar el presupuesto');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(BUDGETS.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', 'list'] });
      toast.success('Presupuesto eliminado correctamente');
    },
    onError: (err: any) => {
      toast.error(err.error || 'Error al eliminar el presupuesto');
    }
  });

  return {
    budgets: Array.isArray(data) ? data : data?.budgets || [],
    isLoading,
    error: error ? (error as any).error || 'Error fetching budgets' : null,
    refetch,
    createBudget: createMutation.mutate,
    updateBudget: updateMutation.mutate,
    deleteBudget: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
