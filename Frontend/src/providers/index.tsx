'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
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

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const theme = useAppStore((s) => s.theme) || 'onyx';
  const accentColor = useAppStore((s) => s.accentColor) || '#EA580C';
  const logout = useAppStore((s) => s.logout);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hexToRgb = useCallback((hex: any) => {
    try {
      if (typeof hex !== 'string' || !hex.startsWith('#')) return "234, 88, 12";
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `${r}, ${g}, ${b}`;
    } catch {
      return "234, 88, 12";
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    
    const themes = [
      'theme-vintage', 'theme-modern', 'theme-minimal', 'theme-glass', 
      'theme-onyx', 'theme-ivory', 'theme-ocean', 'theme-frost', 
      'theme-copper', 'theme-amethyst'
    ];
    root.classList.remove(...themes);
    root.classList.add(`theme-${theme}`);
    
    root.style.setProperty('--primary-custom', accentColor);
    root.style.setProperty('--primary-rgb', hexToRgb(accentColor));
    root.style.setProperty('--primary-custom-soft', `${accentColor}20`);
    root.style.setProperty('--primary-custom-bold', `${accentColor}dd`);
  }, [isDarkMode, theme, accentColor, hexToRgb]);

  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('storage', (e) => {
      if (e.key === 'auth_token' && !e.newValue) logout();
    });
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [logout]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
