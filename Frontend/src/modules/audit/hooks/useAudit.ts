'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { AUDIT } from '@/lib/api/endpoints';

import { useAppStore } from '@/lib/stores/useAppStore';

export function useAudit(params: any = {}) {
  const currentCompany = useAppStore(s => s.currentCompany);
  const companyId = currentCompany?.id;

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['audit-logs', { ...params, companyId }],
    queryFn: () => apiClient.get(AUDIT.list, { ...params, companyId }),
    retry: false,
    enabled: !!companyId,
  });

  // Handle paginated response
  const logs = data?.data?.data || data?.data || (Array.isArray(data) ? data : []);
  const pagination = data?.data?.pagination || data?.pagination || { 
    total: 0, 
    page: 1, 
    limit: 20, 
    totalPages: 1 
  };

  return {
    logs,
    pagination,
    isLoading,
    error,
  };
}
