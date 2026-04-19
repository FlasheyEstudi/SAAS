'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { INVOICES, THIRD_PARTIES } from '@/lib/api/endpoints';
import type { Invoice, ThirdParty } from '@/lib/api/types';

export interface CreateInvoiceData {
  invoiceType: string;
  description: string;
  invoiceDate: string;
  dueDate: string;
  thirdPartyId: string;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
  }>;
}

/**
 * Hook for invoices - consumes real Backend APIs
 */
export function useInvoices() {
  const queryClient = useQueryClient();

  // Fetch invoices list
  const { data: invoicesData, isLoading: invoicesLoading, error: invoicesError } = useQuery<{ data: Invoice[] }>({
    queryKey: ['invoices', 'list'],
    queryFn: () => apiClient.get<{ data: Invoice[] }>(INVOICES.list),
    retry: false,
  });

  // Fetch third parties
  const { data: thirdPartiesData, isLoading: thirdPartiesLoading } = useQuery<{ data: ThirdParty[] }>({
    queryKey: ['third-parties', 'list'],
    queryFn: () => apiClient.get<{ data: ThirdParty[] }>(THIRD_PARTIES.list),
    retry: false,
  });

  // Fetch aging report
  const { data: agingData, isLoading: agingLoading } = useQuery<any>({
    queryKey: ['invoices', 'aging'],
    queryFn: () => apiClient.get(INVOICES.aging),
    retry: false,
  });

  // Fetch summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery<any>({
    queryKey: ['invoices', 'summary'],
    queryFn: () => apiClient.get(INVOICES.summary),
    retry: false,
  });

  // Create invoice mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateInvoiceData) => apiClient.post<Invoice>(INVOICES.create, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  // Update invoice mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateInvoiceData> }) => 
      apiClient.put<Invoice>(INVOICES.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  // Delete invoice mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(INVOICES.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  // Pay invoice mutation
  const payMutation = useMutation({
    mutationFn: (id: string) => apiClient.post<Invoice>(INVOICES.pay(id), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  // Recalculate invoice mutation
  const recalculateMutation = useMutation({
    mutationFn: (id: string) => apiClient.post<Invoice>(INVOICES.recalculate(id), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  return {
    invoices: invoicesData?.data || [],
    thirdParties: thirdPartiesData?.data || [],
    aging: agingData,
    summary: summaryData,
    isLoading: invoicesLoading || thirdPartiesLoading || agingLoading || summaryLoading,
    error: invoicesError,
    createInvoice: createMutation.mutateAsync,
    updateInvoice: updateMutation.mutateAsync,
    deleteInvoice: deleteMutation.mutateAsync,
    payInvoice: payMutation.mutateAsync,
    recalculateInvoice: recalculateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isPaying: payMutation.isPending,
  };
}

/**
 * Hook for single invoice detail
 */
export function useInvoice(id: string) {
  const { data, isLoading, error } = useQuery<Invoice>({
    queryKey: ['invoices', id],
    queryFn: () => apiClient.get<Invoice>(INVOICES.get(id)),
    enabled: !!id,
    retry: false,
  });

  return {
    invoice: data,
    isLoading,
    error,
  };
}
