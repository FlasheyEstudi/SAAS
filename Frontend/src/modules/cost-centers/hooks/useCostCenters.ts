"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { COST_CENTERS } from '@/lib/api/endpoints';
import type { CostCenter } from '@/lib/api/types';

export function useCostCenters() {
  const { data, isLoading, error, refetch } = useQuery<{ costCenters: CostCenter[] }>({
    queryKey: ['cost-centers', 'list'],
    queryFn: () => apiClient.get<{ costCenters: CostCenter[] }>(COST_CENTERS.list),
    retry: false,
  });

  return {
    costCenters: Array.isArray(data) ? data : data?.costCenters || [],
    isLoading,
    error: error ? (error as any).error || 'Error fetching cost centers' : null,
    refetch,
  };
}
