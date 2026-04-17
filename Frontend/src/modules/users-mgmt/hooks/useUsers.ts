"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { AUTH } from '@/lib/api/endpoints';
import type { User } from '@/lib/api/types';

export function useUsers() {
  const { data, isLoading, error, refetch } = useQuery<{ users: User[] }>({
    queryKey: ['users', 'list'],
    queryFn: () => apiClient.get<{ users: User[] }>(AUTH.users),
    retry: false,
  });

  return {
    users: Array.isArray(data) ? data : data?.users || [],
    isLoading,
    error: error ? (error as any).error || 'Error fetching users' : null,
    refetch,
  };
}
