"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PERIODS } from '@/lib/api/endpoints';
import type { Period } from '@/lib/api/types';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/stores/useAppStore';

export function usePeriods() {
  const companyId = useAppStore(s => s.companyId);

  const { data, isLoading, error, refetch } = useQuery<{ periods: Period[] }>({
    queryKey: ['periods', 'list', companyId],
    queryFn: () => apiClient.get<{ periods: Period[] }>(PERIODS.list, { companyId: companyId || '' }),
    retry: false,
    enabled: !!companyId,
  });

  const queryClient = useQueryClient();

  const closeMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(PERIODS.close(id), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods', 'list'] });
    }
  });

  const reopenMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(PERIODS.reopen(id), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods', 'list'] });
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: { year: number, month: number, companyId: string }) => apiClient.post(PERIODS.create, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods', 'list'] });
      toast.success('Período creado correctamente');
    },
    onError: (err: any) => toast.error(err.error || 'Error al crear período'),
  });

  return {
    periods: (Array.isArray(data) ? data : (data as any)?.periods || (data as any)?.data || []) as Period[],
    isLoading,
    error: error ? (error as any).error || 'Error fetching periods' : null,
    refetch,
    closePeriod: closeMutation.mutateAsync,
    reopenPeriod: reopenMutation.mutateAsync,
    createPeriod: createMutation.mutateAsync,
    isClosing: closeMutation.isPending,
    isReopening: reopenMutation.isPending,
    isCreating: createMutation.isPending,
  };
}
