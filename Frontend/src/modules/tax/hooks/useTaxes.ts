'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { TAX } from '@/lib/api/endpoints';

export interface TaxRate {
  id: string;
  companyId: string;
  taxType: 'IVA' | 'ISR' | 'RET_IVA' | 'RET_ISR' | 'IEPS' | 'CEDULAR';
  rate: number;
  name: string;
  description: string | null;
  isRetention: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaxEntry {
  id: string;
  invoiceId: string;
  taxRateId: string;
  taxableBase: number;
  taxAmount: number;
  taxRate: TaxRate;
  createdAt: string;
}

export function useTaxes() {
  const queryClient = useQueryClient();

  // Fetch tax rates
  const { data: ratesData, isLoading: loadingRates, error: ratesError } = useQuery<any>({
    queryKey: ['tax-rates', 'list'],
    queryFn: () => {
      const companyId = localStorage.getItem('current_company_id');
      return apiClient.get(TAX.rates.list, { companyId: companyId || undefined });
    },
    retry: false,
  });

  // Fetch tax entries (for reports)
  const { data: entriesData, isLoading: loadingEntries } = useQuery<any>({
    queryKey: ['tax-entries', 'list'],
    queryFn: () => {
      const companyId = localStorage.getItem('current_company_id');
      return apiClient.get(TAX.entries.list, { companyId: companyId || undefined });
    },
    retry: false,
  });

  // Create tax rate mutation
  const createRate = useMutation({
    mutationFn: (data: any) => {
      const companyId = localStorage.getItem('current_company_id');
      return apiClient.post(TAX.rates.create, { ...data, companyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-rates'] });
    },
  });

  // Update tax rate mutation
  const updateRate = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<any> }) =>
      apiClient.put(TAX.rates.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-rates'] });
    },
  });

  // Delete tax rate mutation
  const deleteRate = useMutation({
    mutationFn: (id: string) => apiClient.delete(TAX.rates.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-rates'] });
    },
  });

  const rates = Array.isArray(ratesData) ? ratesData : ratesData?.data || [];
  const entries = Array.isArray(entriesData) ? entriesData : entriesData?.data || [];

  return {
    rates,
    entries,
    isLoading: loadingRates || loadingEntries,
    error: ratesError,
    createRate: createRate.mutateAsync,
    updateRate: updateRate.mutateAsync,
    deleteRate: deleteRate.mutateAsync,
    isCreating: createRate.isPending,
    isUpdating: updateRate.isPending,
    isDeleting: deleteRate.isPending,
  };
}
