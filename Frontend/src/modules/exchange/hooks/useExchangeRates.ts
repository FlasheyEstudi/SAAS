"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { EXCHANGE_RATES } from '@/lib/api/endpoints';
import type { ExchangeRate } from '@/lib/api/types';

export function useExchangeRates() {
  const { data, isLoading, error, refetch } = useQuery<{ exchangeRates: ExchangeRate[] }>({
    queryKey: ['exchange-rates', 'list'],
    queryFn: () => apiClient.get<{ exchangeRates: ExchangeRate[] }>(EXCHANGE_RATES.list),
    retry: false,
  });

  return {
    exchangeRates: Array.isArray(data) ? data : data?.exchangeRates || [],
    isLoading,
    error: error ? (error as any).error || 'Error fetching exchange rates' : null,
    refetch,
  };
}
