"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { AUTH } from '@/lib/api/endpoints';
import type { User } from '@/lib/api/types';
import { toast } from 'sonner';

export function useUsers() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<{ users: User[] }>({
    queryKey: ['users', 'list'],
    queryFn: () => apiClient.get<{ users: User[] }>(AUTH.users),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<User>) => apiClient.post(AUTH.users, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario creado correctamente');
    },
    onError: (err: any) => toast.error(err.error || 'Error al crear usuario'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<User> }) => 
      apiClient.put(AUTH.updateUser(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario actualizado correctamente');
    },
    onError: (err: any) => toast.error(err.error || 'Error al actualizar usuario'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(AUTH.deleteUser(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario eliminado correctamente');
    },
    onError: (err: any) => toast.error(err.error || 'Error al eliminar usuario'),
  });

  return {
    users: Array.isArray(data) ? data : data?.users || [],
    isLoading,
    error: error ? (error as any).error || 'Error fetching users' : null,
    refetch,
    createUser: createMutation.mutateAsync,
    updateUser: updateMutation.mutateAsync,
    deleteUser: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
