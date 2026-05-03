'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const theme = useAppStore((s) => s.theme);
  const accentColor = useAppStore((s) => s.accentColor);
  const logout = useAppStore((s) => s.logout);

  useEffect(() => {
    const root = document.documentElement;
    
    // Dark mode logic
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    
    // Theme classes - Full list updated
    const themes = [
      'theme-vintage', 'theme-modern', 'theme-minimal', 'theme-glass', 
      'theme-onyx', 'theme-ivory', 'theme-ocean', 'theme-frost', 
      'theme-copper', 'theme-amethyst'
    ];
    root.classList.remove(...themes);
    root.classList.add(`theme-${theme}`);
    
    // Accent color
    root.style.setProperty('--primary-custom', accentColor);
    root.style.setProperty('--primary-custom-soft', `${accentColor}20`); 
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] overflow-hidden">
        <div className="relative flex flex-col items-center">
          {/* Spiritual-tech Golden Pulse */}
          <div className="absolute inset-0 bg-amber-500/30 blur-[100px] rounded-full animate-pulse scale-150" />
          
          <div className="relative mb-8">
            <div className="w-24 h-24 border-2 border-amber-500/10 border-t-amber-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
               <img 
                 src="/GaneshaLogo.png" 
                 alt="Ganesha Logo"
                 className="w-14 h-14 object-contain animate-pulse"
               />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h1 className="text-3xl font-black text-white tracking-[0.6em] animate-pulse">
              GANESHA
            </h1>
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.8em] opacity-60">
              Intelligence System
            </span>
          </div>
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
