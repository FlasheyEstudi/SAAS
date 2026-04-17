"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { COMPANIES } from '@/lib/api/endpoints';
import type { Company } from '@/lib/api/types';

export function useCompanies() {
  const { data, isLoading, error, refetch } = useQuery<{ companies: Company[] }>({
    queryKey: ['companies', 'list'],
    queryFn: () => apiClient.get<{ companies: Company[] }>(COMPANIES.list),
    retry: false,
  });

  return {
    companies: Array.isArray(data) ? data : data?.companies || [],
    isLoading,
    error: error ? (error as any).error || 'Error fetching companies' : null,
    refetch,
  };
}
