"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { NOTIFICATIONS } from '@/lib/api/endpoints';
import type { Notification } from '@/lib/api/types';

export function useNotifications() {
  const { data, isLoading, error, refetch } = useQuery<{ notifications: Notification[] }>({
    queryKey: ['notifications', 'list'],
    queryFn: () => apiClient.get<{ notifications: Notification[] }>(NOTIFICATIONS.list),
    retry: false,
  });

  return {
    notifications: Array.isArray(data) ? data : data?.notifications || [],
    isLoading,
    error: error ? (error as any).error || 'Error fetching notifications' : null,
    refetch,
  };
}
