"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PERIODS } from '@/lib/api/endpoints';
import type { Period } from '@/lib/api/types';

export function usePeriods() {
  const { data, isLoading, error, refetch } = useQuery<{ periods: Period[] }>({
    queryKey: ['periods', 'list'],
    queryFn: () => apiClient.get<{ periods: Period[] }>(PERIODS.list),
    retry: false,
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

  return {
    periods: Array.isArray(data) ? data : data?.periods || [],
    isLoading,
    error: error ? (error as any).error || 'Error fetching periods' : null,
    refetch,
    closePeriod: closeMutation.mutateAsync,
    reopenPeriod: reopenMutation.mutateAsync,
    isClosing: closeMutation.isPending,
    isReopening: reopenMutation.isPending,
  };
}
