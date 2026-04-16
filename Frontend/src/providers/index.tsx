'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useSyncExternalStore } from 'react';
import { useAppStore } from '@/lib/stores/useAppStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const logout = useAppStore((s) => s.logout);

  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('storage', (e) => {
      if (e.key === 'auth_token' && !e.newValue) logout();
    });
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [logout]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vintage-50">
        <div className="animate-pulse-soft">
          <div className="text-4xl mb-2">📒</div>
          <p className="text-vintage-600 text-sm font-playfair">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
