"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { FINANCIAL_CONCEPTS } from '@/lib/api/endpoints';
import { useAppStore } from '@/lib/stores/useAppStore';
import { toast } from 'sonner';

export interface FinancialConcept {
  id: string;
  code: string;
  name: string;
  category: 'NOMINA' | 'SERVICIO' | 'IMPUESTO' | 'ANTICIPO' | 'TRASPASO' | 'AJUSTE' | 'OTRO';
  defaultAccountId?: string;
  defaultCostCenterId?: string;
  isActive: boolean;
  account?: { id: string, name: string, code: string };
  costCenter?: { id: string, name: string, code: string };
}

export function useFinancialConcepts() {
  const queryClient = useQueryClient();
  const companyId = useAppStore(s => s.companyId);

  const { data: concepts, isLoading: loading } = useQuery<FinancialConcept[]>({
    queryKey: ['financial-concepts', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const res = await apiClient.get<any>(`${FINANCIAL_CONCEPTS.list}?companyId=${companyId}`);
      return res?.data || res || [];
    },
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<FinancialConcept>) => 
      apiClient.post(FINANCIAL_CONCEPTS.create, { ...data, companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-concepts'] });
      toast.success('Concepto creado correctamente');
    },
    onError: (err: any) => toast.error(err.error || 'Error al crear concepto'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<FinancialConcept> }) => 
      apiClient.put(FINANCIAL_CONCEPTS.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-concepts'] });
      toast.success('Concepto actualizado correctamente');
    },
    onError: (err: any) => toast.error(err.error || 'Error al actualizar concepto'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(FINANCIAL_CONCEPTS.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-concepts'] });
      toast.success('Concepto eliminado correctamente');
    },
    onError: (err: any) => toast.error(err.error || 'Error al eliminar concepto'),
  });

  return {
    concepts: Array.isArray(concepts) ? concepts : [],
    isLoading: loading,
    createConcept: createMutation.mutateAsync,
    updateConcept: updateMutation.mutateAsync,
    deleteConcept: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
