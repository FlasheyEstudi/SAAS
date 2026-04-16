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
        'bg-gradient-to-r from-vintage-300 to-vintage-400 text-white hover:from-vintage-400 hover:to-vintage-500 shadow-sm hover:shadow-md active:shadow-sm',
      outline:
        'border-2 border-vintage-300 text-vintage-700 bg-transparent hover:bg-vintage-50 hover:border-vintage-400',
      ghost: 'text-vintage-700 hover:bg-vintage-100',
      secondary: 'bg-vintage-100 text-vintage-800 hover:bg-vintage-200',
      destructive: 'bg-error/90 text-white hover:bg-error',
      success: 'bg-success/90 text-white hover:bg-success',
      warning: 'bg-warning/90 text-white hover:bg-warning',
      link: 'text-vintage-500 underline-offset-4 hover:underline',
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
