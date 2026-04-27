import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { EXCHANGE_RATES } from '@/lib/api/endpoints';
import type { ExchangeRate } from '@/lib/api/types';

export function useExchangeRates() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<any>({
    queryKey: ['exchange-rates', 'list'],
    queryFn: () => {
      const companyId = localStorage.getItem('current_company_id');
      return apiClient.get(EXCHANGE_RATES.list, { companyId: companyId || undefined });
    },
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const companyId = localStorage.getItem('current_company_id');
      return apiClient.post(EXCHANGE_RATES.list, { ...data, companyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`${EXCHANGE_RATES.list}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
    },
  });

  // Handle both array and object responses
  let rawRates: any[] = [];
  if (Array.isArray(data)) rawRates = data;
  else if (data?.data && Array.isArray(data.data)) rawRates = data.data;
  else if (data?.exchangeRates) rawRates = data.exchangeRates;

  const rates: ExchangeRate[] = rawRates.map(r => ({
    ...r,
    date: r.date || r.effectiveDate || r.createdAt,
    effectiveDate: r.effectiveDate || r.date || r.createdAt
  }));

  return {
    exchangeRates: rates,
    isLoading,
    error: error ? (error as any).error || 'Error fetching exchange rates' : null,
    refetch,
    createExchangeRate: createMutation.mutateAsync,
    deleteExchangeRate: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
