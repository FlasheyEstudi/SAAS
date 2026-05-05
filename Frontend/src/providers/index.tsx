'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/stores/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Fallback para dispositivos móviles donde el useEffect principal puede tardar o bloquearse
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mounted) setMounted(true);
    }, 4000); // Aumentado a 4s para dar más margen en redes lentas
    return () => clearTimeout(timer);
  }, [mounted]);

  return mounted;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const theme = useAppStore((s) => s.theme);
  const accentColor = useAppStore((s) => s.accentColor);
  const logout = useAppStore((s) => s.logout);

  const hexToRgb = useCallback((hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    
    // Dark mode logic
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    
    // Theme classes
    const themes = [
      'theme-vintage', 'theme-modern', 'theme-minimal', 'theme-glass', 
      'theme-onyx', 'theme-ivory', 'theme-ocean', 'theme-frost', 
      'theme-copper', 'theme-amethyst'
    ];
    root.classList.remove(...themes);
    root.classList.add(`theme-${theme}`);
    
    // Accent color and RGB variable
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
      <AnimatePresence mode="wait">
        {!mounted ? (
          <motion.div 
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505] text-white overflow-hidden"
          >
            {/* Background Aura */}
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-tr from-primary-custom/20 via-transparent to-primary-custom/10 blur-[120px]"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative z-10"
            >
              <motion.div 
                animate={{ 
                  scale: [1, 1.15, 1],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{ backgroundColor: accentColor }}
                className="absolute inset-0 blur-3xl rounded-full opacity-30"
              />
              <img 
                src="/GaneshaLogo.png" 
                className="w-24 h-24 sm:w-32 sm:h-32 object-contain relative z-10" 
                alt="Ganesha" 
                style={{ filter: 'drop-shadow(0 0 20px ' + accentColor + '80)' }}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-8 flex flex-col items-center z-10"
            >
              <h1 className="font-playfair text-3xl sm:text-4xl font-black tracking-[0.6em] mb-4 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                GANESHA
              </h1>
              <div className="flex items-center gap-4">
                <div className="h-[1px] w-8 bg-gradient-to-r from-transparent via-primary-custom to-transparent opacity-50" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-custom animate-pulse">
                  Despertando Abundancia
                </span>
                <div className="h-[1px] w-8 bg-gradient-to-l from-transparent via-primary-custom to-transparent opacity-50" />
              </div>
            </motion.div>

            {/* Micro-loading bar */}
            <div className="absolute bottom-20 w-48 h-[1px] bg-white/5 overflow-hidden">
              <motion.div 
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-full h-full bg-gradient-to-r from-transparent via-primary-custom to-transparent"
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </QueryClientProvider>
  );
}
