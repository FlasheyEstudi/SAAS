"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { TAX } from '@/lib/api/endpoints';
import { toast } from 'sonner';

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  type: 'VAT' | 'WH' | 'OTHER';
  description?: string;
  isActive: boolean;
}

export interface TaxEntry {
  id: string;
  invoiceId: string;
  taxRateId: string;
  baseAmount: number;
  taxAmount: number;
  taxRate: TaxRate;
  createdAt: string;
}

export function useTaxes() {
  const queryClient = useQueryClient();

  const { data: rates, isLoading: loadingRates } = useQuery<TaxRate[]>({
    queryKey: ['tax-rates', 'list'],
    queryFn: async () => {
        const res = await apiClient.get<any>(TAX.rates.list);
        return res?.data || res || [];
    },
  });

  const { data: entries, isLoading: loadingEntries } = useQuery<TaxEntry[]>({
    queryKey: ['tax-entries', 'list'],
    queryFn: async () => {
        const res = await apiClient.get<any>(TAX.entries.list);
        return res?.data || res || [];
    },
  });

  const createRateMutation = useMutation({
    mutationFn: (newRate: Partial<TaxRate>) => apiClient.post(TAX.rates.create, newRate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-rates'] });
      toast.success('Tasa de impuesto creada');
    },
    onError: (err: any) => toast.error(err.error || 'Error al crear tasa'),
  });

  const updateRateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<TaxRate> }) => 
      apiClient.put(TAX.rates.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-rates'] });
      toast.success('Tasa de impuesto actualizada');
    },
    onError: (err: any) => toast.error(err.error || 'Error al actualizar tasa'),
  });

  return {
    rates: Array.isArray(rates) ? rates : [],
    entries: Array.isArray(entries) ? entries : [],
    isLoading: loadingRates || loadingEntries,
    createRate: createRateMutation.mutateAsync,
    updateRate: updateRateMutation.mutateAsync,
    isCreating: createRateMutation.isPending,
    isUpdating: updateRateMutation.isPending,
  };
}
