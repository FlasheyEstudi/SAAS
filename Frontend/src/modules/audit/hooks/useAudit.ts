'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { AUDIT } from '@/lib/api/endpoints';

export function useAudit(params: any = {}) {
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['audit-logs', params],
    queryFn: () => apiClient.get(AUDIT.list, params),
    retry: false,
  });

  // Handle paginated response
  const logs = data?.data || [];
  const pagination = data?.pagination || { 
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
