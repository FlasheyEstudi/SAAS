"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { NOTIFICATIONS } from '@/lib/api/endpoints';
import type { AppNotification } from '@/lib/api/types';
import { toast } from 'sonner';

export function useNotifications() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<{ notifications: AppNotification[] }>({
    queryKey: ['notifications', 'list'],
    queryFn: () => apiClient.get<{ notifications: AppNotification[] }>(NOTIFICATIONS.list),
    retry: false,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(NOTIFICATIONS.markRead(id), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => toast.error('Error al marcar notificación como leída')
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiClient.post(NOTIFICATIONS.markAllRead, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Todas las notificaciones marcadas como leídas');
    },
    onError: () => toast.error('Error al marcar todas como leídas')
  });

  return {
    notifications: Array.isArray(data) ? data : data?.notifications || (data as any)?.data || [],
    isLoading,
    error: error ? (error as any).error || 'Error fetching notifications' : null,
    refetch,
    markAsRead: markReadMutation.mutate,
    markAllAsRead: markAllReadMutation.mutate,
    isMarkingRead: markReadMutation.isPending,
  };
}
