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

import { useAppStore } from '@/lib/stores/useAppStore';

/**
 * Hook for invoices - consumes real Backend APIs
 */
export function useInvoices() {
  const queryClient = useQueryClient();
  const currentCompany = useAppStore(s => s.currentCompany);
  const companyId = currentCompany?.id;

  // Fetch invoices list
  const { data: invoicesData, isLoading: invoicesLoading, error: invoicesError } = useQuery<any>({
    queryKey: ['invoices', 'list', companyId],
    queryFn: () => apiClient.get<any>(`${INVOICES.list}?companyId=${companyId || ''}`),
    retry: false,
    enabled: !!companyId,
  });

  // Fetch third parties
  const { data: thirdPartiesData, isLoading: thirdPartiesLoading } = useQuery<any>({
    queryKey: ['third-parties', 'list', companyId],
    queryFn: () => apiClient.get<any>(`${THIRD_PARTIES.list}?companyId=${companyId || ''}`),
    retry: false,
    enabled: !!companyId,
  });

  // Fetch aging report
  const { data: agingData, isLoading: agingLoading } = useQuery<any>({
    queryKey: ['invoices', 'aging', companyId],
    queryFn: () => apiClient.get(`${INVOICES.aging}?companyId=${companyId || ''}`),
    retry: false,
    enabled: !!companyId,
  });

  // Fetch summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery<any>({
    queryKey: ['invoices', 'summary', companyId],
    queryFn: () => apiClient.get(`${INVOICES.summary}?companyId=${companyId || ''}`),
    retry: false,
    enabled: !!companyId,
  });

  // Create invoice mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateInvoiceData) => apiClient.post<Invoice>(INVOICES.create, { ...data, companyId }),
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
    mutationFn: ({ id, amount, description }: { id: string; amount: number; description?: string }) => 
      apiClient.post<Invoice>(INVOICES.pay(id), { amount, description }),
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

  const unboxList = (d: any) => {
    if (Array.isArray(d?.data?.data)) return d.data.data;
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(d)) return d;
    return [];
  };

  const unboxData = (d: any) => d?.data || d;

  return {
    invoices: unboxList(invoicesData) as Invoice[],
    thirdParties: unboxList(thirdPartiesData) as ThirdParty[],
    aging: unboxData(agingData),
    summary: unboxData(summaryData),
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
    getInvoice: (id: string) => (unboxList(invoicesData) as Invoice[]).find(inv => inv.id === id),
  };
}

/**
 * Hook for single invoice detail
 */
export function useInvoice(id: string) {
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['invoices', id],
    queryFn: () => apiClient.get<any>(INVOICES.get(id)),
    enabled: !!id,
    retry: false,
  });

  return {
    invoice: (data?.data || data) as Invoice,
    isLoading,
    error,
  };
}
