'use client';

import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { forwardRef } from 'react';

export interface PastelButtonProps extends Omit<ButtonProps, 'variant'> {
  loading?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'link' | 'secondary' | 'success' | 'warning';
  children?: React.ReactNode;
}

export const PastelButton = forwardRef<HTMLButtonElement, PastelButtonProps>(
  ({ className, loading, children, variant = 'default', disabled, ...props }, ref) => {
    const variantStyles = {
      default:
        'bg-gradient-to-r from-vintage-300 to-vintage-400 dark:from-zinc-700 dark:to-zinc-800 text-white hover:from-vintage-400 hover:to-vintage-500 dark:hover:from-zinc-600 dark:hover:to-zinc-700 shadow-sm hover:shadow-md active:shadow-sm',
      outline:
        'border-2 border-vintage-300 dark:border-zinc-700 text-vintage-700 dark:text-zinc-300 bg-transparent hover:bg-vintage-50 dark:hover:bg-zinc-800/50 hover:border-vintage-400 dark:hover:border-zinc-600',
      ghost: 'text-vintage-700 dark:text-zinc-400 hover:bg-vintage-100 dark:hover:bg-zinc-800',
      secondary: 'bg-vintage-100 dark:bg-zinc-800 text-vintage-800 dark:text-zinc-200 hover:bg-vintage-200 dark:hover:bg-zinc-700',
      destructive: 'bg-error/90 dark:bg-red-950/40 dark:text-red-400 dark:border dark:border-red-900/50 text-white hover:bg-error dark:hover:bg-red-900/60',
      success: 'bg-success/90 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border dark:border-emerald-900/50 text-white hover:bg-success dark:hover:bg-emerald-900/60',
      warning: 'bg-warning/90 dark:bg-amber-950/40 dark:text-amber-400 dark:border dark:border-amber-900/50 text-white hover:bg-warning dark:hover:bg-amber-900/60',
      link: 'text-vintage-500 underline-offset-4 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200',
    };

    return (
      <Button
        ref={ref}
        className={cn(
          'rounded-xl font-medium transition-all duration-300 relative overflow-hidden',
          variantStyles[variant] || variantStyles.default,
          (loading || disabled) && 'opacity-70 cursor-not-allowed',
          className
        )}
        disabled={loading || disabled}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
        {/* Shimmer effect on hover */}
        {variant === 'default' && (
          <span className="absolute inset-0 shimmer-bg opacity-0 hover:opacity-100 transition-opacity" />
        )}
      </Button>
    );
  }
);

PastelButton.displayName = 'PastelButton';
