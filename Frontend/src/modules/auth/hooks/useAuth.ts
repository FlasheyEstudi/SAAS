'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/stores/useAppStore';
import { AUTH } from '@/lib/api/endpoints';
import { useApiMutation } from '@/lib/hooks/useApi';
import type { AuthResponse, User } from '@/lib/api/types';

interface LoginCredentials {
  email: string;
  password: string;
  companyId: string;
}

/**
 * Auth hook — handles login via Backend API.
 *
 * - On success: stores token/user/companyId in localStorage + Zustand,
 *   navigates to 'dashboard'.
 * - Returns `login`, `isLoading`, `error`.
 */
export function useAuth() {
  const [error, setError] = useState<string | null>(null);
  const loginAction = useAppStore((s) => s.login);

  // TanStack Query mutation wired to the real backend endpoint
  const loginMutation = useApiMutation<AuthResponse, LoginCredentials>(AUTH.login, {
    showToast: false,
  });

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setError(null);

      try {
        const payload = (await loginMutation.mutateAsync(credentials)) as any;
        const responseData = payload.data || payload; 
        
        loginAction(responseData.user, responseData.token, responseData.companyId || credentials.companyId);
        toast.success(`¡Bienvenida, ${responseData.user?.name || 'Admin'}!`);
      } catch (err: any) {
        const msg = err?.error || err?.message || 'Error al iniciar sesión';
        setError(msg);
        toast.error(msg);
      }
    },
    [loginAction, loginMutation]
  );

  const isLoading = loginMutation.isPending;

  return { login, isLoading, error, clearError: () => setError(null) };
}
