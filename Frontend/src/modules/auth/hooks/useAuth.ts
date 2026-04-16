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
}

// Mock data for development when no backend is available
const MOCK_USER: User = {
  id: '1',
  email: 'admin@contable.com',
  name: 'María García',
  role: 'ADMIN',
  createdAt: new Date().toISOString(),
};

const MOCK_TOKEN = 'mock-jwt-token-erp-contable-2025';
const MOCK_COMPANY_ID = 'company-001';

/**
 * Auth hook — handles login via API or mock simulation.
 *
 * - On success: stores token/user/companyId in localStorage + Zustand,
 *   navigates to 'dashboard'.
 * - Returns `login`, `isLoading`, `error`.
 */
export function useAuth() {
  const [error, setError] = useState<string | null>(null);
  const loginAction = useAppStore((s) => s.login);

  // TanStack Query mutation wired to the real endpoint (will 404 without backend)
  const loginMutation = useApiMutation<AuthResponse, LoginCredentials>(AUTH.login);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setError(null);

      try {
        // --- Try real API first ---
        try {
          const response = await loginMutation.mutateAsync(credentials);
          loginAction(response.user, response.token, response.companyId);
          toast.success(`¡Bienvenida, ${response.user.name}!`);
          return;
        } catch {
          // If API is unreachable, fall through to mock
        }

        // --- Mock simulation (1.5 s delay) ---
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Validate mock credentials: accept any email with password length >= 4
        if (credentials.password.length < 4) {
          const msg = 'Credenciales inválidas. Verifica tu correo y contraseña.';
          setError(msg);
          toast.error(msg);
          return;
        }

        loginAction(MOCK_USER, MOCK_TOKEN, MOCK_COMPANY_ID);
        toast.success(`¡Bienvenida, ${MOCK_USER.name}!`);
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
