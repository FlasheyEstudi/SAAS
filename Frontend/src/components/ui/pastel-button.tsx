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
        'bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-[0.98]',
      outline:
        'border-2 border-primary/20 text-foreground bg-transparent hover:bg-primary/10 hover:border-primary/40',
      ghost: 'text-foreground hover:bg-muted',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      destructive: 'bg-destructive text-white hover:opacity-90',
      success: 'bg-success text-white hover:opacity-90',
      warning: 'bg-warning text-white hover:opacity-90',
      link: 'text-primary underline-offset-4 hover:underline',
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
