"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PERIODS } from '@/lib/api/endpoints';
import type { Period } from '@/lib/api/types';

export function usePeriods() {
  const { data, isLoading, error, refetch } = useQuery<{ periods: Period[] }>({
    queryKey: ['periods', 'list'],
    queryFn: () => apiClient.get<{ periods: Period[] }>(PERIODS.list),
    retry: false,
  });

  return {
    periods: Array.isArray(data) ? data : data?.periods || [],
    isLoading,
    error: error ? (error as any).error || 'Error fetching periods' : null,
    refetch,
  };
}
