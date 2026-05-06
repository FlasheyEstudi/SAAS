'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GaneshaLoaderProps {
  variant?: 'full' | 'compact';
  message?: string;
  className?: string;
}

export function GaneshaLoader({ variant = 'full', message, className }: GaneshaLoaderProps) {
  if (variant === 'compact') {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8", className)}>
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.img 
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ 
                scale: [0.9, 1.1, 0.9],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              src="/GaneshaLogo.png" 
              className="w-8 h-8 object-contain"
              alt="Ganesha"
            />
          </div>
        </div>
        {message && <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary animate-pulse">{message}</p>}
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 z-[999] bg-[#050505] flex flex-col items-center justify-center transition-colors duration-700",
        className
      )}
    >
      {/* Aura de fondo */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full animate-pulse" />
      </div>

      <div className="relative z-10">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border-[2px] border-primary/10 border-t-primary shadow-[0_0_80px_rgba(234,88,12,0.15)]"
        />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.img 
            initial={{ scale: 0.85, opacity: 0.1 }}
            animate={{ 
              scale: [0.9, 1.1, 0.9],
              opacity: [0.9, 1, 0.9]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            src="/GaneshaLogo.png" 
            className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
            style={{ 
              filter: 'drop-shadow(0 0 30px rgba(234, 88, 12, 0.3))',
              zIndex: 30 
            }}
            alt="Ganesha Loading"
          />
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-16 text-center z-10"
      >
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-[0.6em] text-primary drop-shadow-sm">
          {message || 'Ganesha Inteligencia'}
        </h2>
        <div className="mt-4 flex justify-center gap-1.5">
           {[0, 1, 2].map((i) => (
             <motion.div 
               key={i}
               animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
               transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
               className="w-1.5 h-1.5 rounded-full bg-primary"
             />
           ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
