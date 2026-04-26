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
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const theme = useAppStore((s) => s.theme);
  const accentColor = useAppStore((s) => s.accentColor);
  const logout = useAppStore((s) => s.logout);

  useEffect(() => {
    const root = document.documentElement;
    
    // Dark mode
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    
    // Theme classes
    const themes = ['theme-vintage', 'theme-modern', 'theme-minimal', 'theme-glass'];
    root.classList.remove(...themes);
    root.classList.add(`theme-${theme}`);
    
    // Accent color
    root.style.setProperty('--primary-custom', accentColor);
    // Rough approximation for secondary (lighter) and tertiary
    root.style.setProperty('--primary-custom-soft', `${accentColor}20`); // 20% opacity
    root.style.setProperty('--primary-custom-bold', `${accentColor}dd`); 
  }, [isDarkMode, theme, accentColor]);

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
