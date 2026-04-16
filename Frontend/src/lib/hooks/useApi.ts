'use client';

import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

/**
 * Generic mutation hook wrapping TanStack Query's useMutation with apiClient.
 * Automatically handles error toasts unless showToast is false.
 */
export function useApiMutation<TData = any, TVariables = any, TContext = unknown>(
  url: string,
  options?: UseMutationOptions<TData, Error, TVariables, TContext> & {
    showToast?: boolean;
    successMessage?: string;
    errorMessage?: string;
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  }
) {
  const {
    showToast = false,
    successMessage,
    errorMessage,
    method = 'POST',
    onSuccess,
    onError,
    ...mutationOptions
  } = options || {};

  return useMutation<TData, Error, TVariables, TContext>({
    mutationFn: async (variables: TVariables) => {
      switch (method) {
        case 'PUT':
          return apiClient.put<TData>(url, variables);
        case 'PATCH':
          return apiClient.patch<TData>(url, variables);
        case 'DELETE':
          return apiClient.delete<TData>(url, variables as Record<string, any>);
        default:
          return apiClient.post<TData>(url, variables);
      }
    },
    onSuccess: (data, variables, context) => {
      if (showToast && successMessage) {
        toast.success(successMessage);
      }
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      if (showToast) {
        const err = error as any;
        toast.error(errorMessage || err?.error || err?.message || 'Error en la operación');
      }
      onError?.(error, variables, context);
    },
    ...mutationOptions,
  });
}

/**
 * Generic query hook wrapping TanStack Query's useQuery with apiClient.
 */
export function useApiQuery<TData = any, TParams = Record<string, any>>(
  queryKey: string[],
  url: string,
  params?: TParams,
  options?: Omit<UseQueryOptions<TData, Error, TData>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, Error>({
    queryKey,
    queryFn: () => apiClient.get<TData>(url, params as Record<string, any>),
    ...options,
  });
}
