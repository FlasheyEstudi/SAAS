"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { THIRD_PARTIES } from '@/lib/api/endpoints';
import type { ThirdParty } from '@/lib/api/types';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/stores/useAppStore';

export function useThirdParties() {
  const queryClient = useQueryClient();
  const currentCompany = useAppStore(s => s.currentCompany);
  const companyId = currentCompany?.id;

  const { data, isLoading, error, refetch } = useQuery<any>({
    queryKey: ['third-parties', 'list', companyId],
    queryFn: () => apiClient.get<any>(`${THIRD_PARTIES.list}?companyId=${companyId || ''}`),
    retry: false,
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (newParty: Partial<ThirdParty>) => 
      apiClient.post(THIRD_PARTIES.create, { ...newParty, companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['third-parties'] });
      toast.success('Tercero creado correctamente');
    },
    onError: (err: any) => toast.error(err.error || 'Error al crear tercero'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<ThirdParty> }) => 
      apiClient.put(THIRD_PARTIES.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['third-parties'] });
      toast.success('Tercero actualizado correctamente');
    },
    onError: (err: any) => toast.error(err.error || 'Error al actualizar tercero'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(THIRD_PARTIES.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['third-parties'] });
      toast.success('Tercero eliminado correctamente');
    },
    onError: (err: any) => toast.error(err.error || 'Error al eliminar tercero'),
  });

  // Extract parties safely
  const parties = Array.isArray(data?.data?.data) 
    ? data.data.data 
    : (Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : (data as any)?.thirdParties || []));

  return {
    parties: parties as ThirdParty[],
    isLoading,
    error: error ? (error as any).error || 'Error fetching third parties' : null,
    refetch,
    createParty: createMutation.mutateAsync,
    updateParty: updateMutation.mutateAsync,
    deleteParty: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
