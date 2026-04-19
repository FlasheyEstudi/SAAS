"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { COMPANIES } from '@/lib/api/endpoints';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/stores/useAppStore';
import type { Company } from '@/lib/api/types';

interface CompaniesListResponse {
  data: Company[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function useCompanies() {
  const queryClient = useQueryClient();
  const setCurrentCompany = useAppStore((state) => state.setCurrentCompany);
  const currentCompany = useAppStore((state) => state.currentCompany);

  const { data, isLoading, error, refetch } = useQuery<CompaniesListResponse>({
    queryKey: ['companies', 'list'],
    queryFn: () => apiClient.get<CompaniesListResponse>(COMPANIES.list),
    retry: false,
  });

  const companies = data?.data || [];

  const createMutation = useMutation({
    mutationFn: (companyData: { name: string; taxId: string; address?: string; phone?: string; email?: string; currency?: string }) =>
      apiClient.post<Company>(COMPANIES.create, companyData),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa creada exitosamente');
      if (!currentCompany && response) {
        setCurrentCompany(response);
      }
    },
    onError: (error: any) => {
      toast.error(error?.error || 'Error al crear la empresa');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Company> }) =>
      apiClient.put<Company>(COMPANIES.update(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.error || 'Error al actualizar la empresa');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete<{ deleted: true; id: string }>(COMPANIES.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.error || 'Error al eliminar la empresa');
    },
  });

  return {
    companies,
    isLoading,
    error: error ? (error as any).error || 'Error fetching companies' : null,
    refetch,
    createCompany: createMutation.mutate,
    updateCompany: updateMutation.mutate,
    deleteCompany: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
