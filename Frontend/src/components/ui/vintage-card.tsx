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
      default: 'bg-card border border-vintage-200 shadow-sm',
      glass: 'glass shadow-sm',
      outline: 'bg-transparent border border-vintage-200',
      gradient: 'bg-gradient-to-br from-vintage-50 via-white to-vintage-100 border border-vintage-200 shadow-sm',
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-xl p-5 transition-all duration-300',
          variants[variant],
          hover && 'hover:shadow-md hover:-translate-y-0.5 hover:border-vintage-300',
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
