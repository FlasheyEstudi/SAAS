'use client';

import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';

export interface VintageCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'glass' | 'outline' | 'gradient' | 'premium';
  hover?: boolean;
}

export const VintageCard = forwardRef<HTMLDivElement, VintageCardProps>(
  ({ className, variant = 'default', hover = true, children, ...props }, ref) => {
    const variants = {
      default: 'bg-card border border-border dark:border-zinc-800 shadow-sm transition-all',
      glass: 'glass shadow-xl dark:bg-zinc-950/40 dark:border-zinc-800/50 backdrop-blur-xl transition-all',
      outline: 'bg-transparent border border-border dark:border-zinc-800 transition-all',
      gradient: 'bg-gradient-to-br from-card via-background to-card dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 border border-border dark:border-zinc-800 shadow-sm transition-all',
      premium: 'bg-card border border-border dark:bg-zinc-900/60 dark:border-white/10 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden after:absolute after:inset-0 after:rounded-2xl after:p-[1px] after:bg-gradient-to-br after:from-white/10 after:to-transparent after:pointer-events-none',
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-2xl p-3.5 sm:p-6 transition-all duration-300',
          variants[variant],
          hover && 'hover:shadow-2xl hover:-translate-y-1 hover:border-primary/20 dark:hover:border-primary/30 dark:hover:shadow-black/40',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

VintageCard.displayName = 'VintageCard';
