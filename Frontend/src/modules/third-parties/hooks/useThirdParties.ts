"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { THIRD_PARTIES } from '@/lib/api/endpoints';
import type { ThirdParty } from '@/lib/api/types';

export function useThirdParties() {
  const { data, isLoading, error, refetch } = useQuery<{ thirdParties: ThirdParty[] }>({
    queryKey: ['third-parties', 'list'],
    queryFn: () => apiClient.get<{ thirdParties: ThirdParty[] }>(THIRD_PARTIES.list),
    retry: false,
  });

  return {
    parties: Array.isArray(data) ? data : data?.thirdParties || [],
    isLoading,
    error: error ? (error as any).error || 'Error fetching third parties' : null,
    refetch,
  };
}
