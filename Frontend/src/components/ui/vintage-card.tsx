'use client';

import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';

export interface VintageCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'glass' | 'outline' | 'gradient';
  hover?: boolean;
}

export const VintageCard = forwardRef<HTMLDivElement, VintageCardProps>(
  ({ className, variant = 'default', hover = true, children, ...props }, ref) => {
    const variants = {
      default: 'bg-card border border-vintage-200 dark:border-zinc-800 shadow-sm transition-colors',
      glass: 'glass shadow-sm dark:bg-zinc-950/40 dark:border-zinc-800 transition-colors',
      outline: 'bg-transparent border border-vintage-200 dark:border-zinc-800 transition-colors',
      gradient: 'bg-gradient-to-br from-card via-background to-card dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 border border-vintage-200 dark:border-zinc-800 shadow-sm transition-colors',
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-xl p-5 transition-all duration-300',
          variants[variant],
          hover && 'hover:shadow-md hover:-translate-y-0.5 hover:border-vintage-300 dark:hover:border-zinc-700 dark:hover:shadow-zinc-950/20',
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
