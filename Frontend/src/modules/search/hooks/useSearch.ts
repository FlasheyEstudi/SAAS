"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { SEARCH } from '@/lib/api/endpoints';

export interface SearchResultItem {
  id: string;
  type: 'journal' | 'invoice' | 'third-party' | 'account' | string;
  title: string;
  subtitle: string;
  amount?: number;
  date?: string;
  view: string;
  params: Record<string, string>;
}

export function useSearch(query: string) {
  const { data, isLoading, error, refetch } = useQuery<{ results: SearchResultItem[] }>({
    queryKey: ['search', 'global', query],
    queryFn: () => apiClient.get<{ results: SearchResultItem[] }>(`${SEARCH.global}?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
    retry: false,
  });

  return {
    results: Array.isArray(data) ? data : data?.results || [],
    isLoading,
    error: error ? (error as any).error || 'Error searching' : null,
    refetch,
  };
}
