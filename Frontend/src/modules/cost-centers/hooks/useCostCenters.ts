"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { COST_CENTERS } from '@/lib/api/endpoints';
import type { CostCenter } from '@/lib/api/types';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/stores/useAppStore';

export function useCostCenters() {
  const queryClient = useQueryClient();

  const currentCompany = useAppStore(s => s.currentCompany);
  const companyId = currentCompany?.id;

  const { data, isLoading, error, refetch } = useQuery<any>({
    queryKey: ['cost-centers', 'list', companyId],
    queryFn: () => apiClient.get<any>(`${COST_CENTERS.list}?companyId=${companyId || ''}`),
    retry: false,
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<CostCenter>) => apiClient.post(COST_CENTERS.list, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers', 'list'] });
      toast.success('Centro de costo creado correctamente');
    },
    onError: (err: any) => toast.error(err.error || 'Error al crear el centro de costo'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<CostCenter> }) => 
      apiClient.put(COST_CENTERS.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers', 'list'] });
      toast.success('Centro de costo actualizado correctamente');
    },
    onError: (err: any) => toast.error(err.error || 'Error al actualizar centro de costo'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(COST_CENTERS.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers', 'list'] });
      toast.success('Centro de costo eliminado correctamente');
    },
    onError: (err: any) => toast.error(err.error || 'Error al eliminar centro de costo'),
  });

  // Backend returns { data: [...], pagination: ... }
  const costCenters = data?.data || (Array.isArray(data) ? data : []);

  return {
    costCenters,
    isLoading,
    error: error ? (error as any).error || 'Error fetching cost centers' : null,
    refetch,
    createCostCenter: createMutation.mutateAsync,
    updateCostCenter: updateMutation.mutateAsync,
    deleteCostCenter: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
