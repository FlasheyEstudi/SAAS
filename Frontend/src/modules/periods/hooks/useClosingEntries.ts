"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { CLOSING_ENTRIES } from '@/lib/api/endpoints';
import { toast } from 'sonner';

export interface ClosingEntry {
  id: string;
  periodId: string;
  entryType: 'ANNUAL' | 'MONTHLY';
  description: string;
  totalDebit: number;
  totalCredit: number;
  status: 'DRAFT' | 'POSTED';
  createdAt: string;
}

export function useClosingEntries() {
  const queryClient = useQueryClient();

  const { data: entries, isLoading: loading } = useQuery<ClosingEntry[]>({
    queryKey: ['closing-entries', 'list'],
    queryFn: async () => {
        const res = await apiClient.get<any>(CLOSING_ENTRIES.list);
        return res?.data || res || [];
    },
  });

  const generateMutation = useMutation({
    mutationFn: (data: { periodId: string, type: 'ANNUAL' | 'MONTHLY' }) => 
      apiClient.post(CLOSING_ENTRIES.generate, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closing-entries'] });
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      toast.success('Asiento de cierre generado correctamente');
    },
    onError: (err: any) => toast.error(err.error || 'Error al generar cierre'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(CLOSING_ENTRIES.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closing-entries'] });
      toast.success('Asiento de cierre eliminado');
    },
    onError: (err: any) => toast.error(err.error || 'Error al eliminar cierre'),
  });

  return {
    entries: Array.isArray(entries) ? entries : [],
    isLoading: loading,
    generateClosing: generateMutation.mutateAsync,
    deleteClosing: deleteMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
  };
}
