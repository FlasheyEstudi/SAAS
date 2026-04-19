"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PAYMENT_TERMS } from '@/lib/api/endpoints';
import { useAppStore } from '@/lib/stores/useAppStore';
import { toast } from 'sonner';

export interface PaymentTerm {
  id: string;
  name: string;
  days: number;
  isDefault: boolean;
  isActive: boolean;
}

export function usePaymentTerms() {
  const queryClient = useQueryClient();
  const companyId = useAppStore(s => s.companyId);

  const { data: terms, isLoading: loading } = useQuery<PaymentTerm[]>({
    queryKey: ['payment-terms', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await apiClient.get<any>(`${PAYMENT_TERMS.list}?companyId=${companyId}`);
      return res?.data || res || [];
    },
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<PaymentTerm>) => 
      apiClient.post(PAYMENT_TERMS.create, { ...data, companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-terms'] });
      toast.success('Término de pago creado');
    },
    onError: (err: any) => toast.error(err.error || 'Error al crear término'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<PaymentTerm> }) => 
      apiClient.put(PAYMENT_TERMS.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-terms'] });
      toast.success('Término de pago actualizado');
    },
    onError: (err: any) => toast.error(err.error || 'Error al actualizar término'),
  });

  return {
    terms: Array.isArray(terms) ? terms : [],
    isLoading: loading,
    createTerm: createMutation.mutateAsync,
    updateTerm: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
