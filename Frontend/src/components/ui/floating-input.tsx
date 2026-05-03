'use client';

import { cn } from '@/lib/utils';
import { forwardRef, useState } from 'react';

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, error, icon, type, id, value, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);
    const inputId = id || `input-${label.replace(/\s+/g, '-').toLowerCase()}`;

    return (
      <div className="relative">
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-vintage-600">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            value={value ?? ''}
            className={cn(
              'peer w-full px-3 pt-5 pb-2 text-sm bg-card border rounded-xl transition-all duration-300',
              'focus:outline-none focus:ring-2 focus:ring-vintage-400 focus:border-vintage-400',
              'hover:border-vintage-300 dark:hover:border-zinc-700',
              'dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-700',
              icon && 'pl-10',
              error ? 'border-error focus:ring-error' : 'border-vintage-200',
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false);
              setHasValue(!!e.target.value);
            }}
            onChange={(e) => {
              setHasValue(!!e.target.value);
              props.onChange?.(e);
            }}
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              'absolute left-3 transition-all duration-300 pointer-events-none',
              icon && 'left-10',
              (isFocused || hasValue)
                ? 'top-1.5 text-xs text-vintage-500 font-medium dark:text-zinc-500'
                : 'top-1/2 -translate-y-1/2 text-sm text-vintage-600 dark:text-zinc-600',
              isFocused && 'text-vintage-400 dark:text-zinc-400'
            )}
          >
            {label}
          </label>
        </div>
        {error && (
          <p className="mt-1 text-xs text-error animate-fade-in">{error}</p>
        )}
      </div>
    );
  }
);

FloatingInput.displayName = 'FloatingInput';

// Floating Select variant
interface FloatingSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export const FloatingSelect = forwardRef<HTMLSelectElement, FloatingSelectProps>(
  ({ className, label, error, children, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);
    const inputId = id || `select-${label.replace(/\s+/g, '-').toLowerCase()}`;

    return (
      <div className="relative">
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'peer w-full px-3 pt-5 pb-2 text-sm bg-card border rounded-xl transition-all duration-300 appearance-none',
            'focus:outline-none focus:ring-2 focus:ring-vintage-400 focus:border-vintage-400',
            'hover:border-vintage-300 dark:hover:border-zinc-700',
            'dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-700',
            error ? 'border-error focus:ring-error' : 'border-vintage-200',
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            setHasValue(!!e.target.value);
          }}
          onChange={(e) => {
            setHasValue(!!e.target.value);
            props.onChange?.(e);
          }}
          {...props}
        >
          {children}
        </select>
        <label
          htmlFor={inputId}
          className={cn(
            'absolute left-3 transition-all duration-300 pointer-events-none',
            (isFocused || hasValue)
              ? 'top-1.5 text-xs text-vintage-500 font-medium dark:text-zinc-500'
              : 'top-1/2 -translate-y-1/2 text-sm text-vintage-600 dark:text-zinc-600',
            isFocused && 'text-vintage-400 dark:text-zinc-400'
          )}
        >
          {label}
        </label>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-vintage-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {error && (
          <p className="mt-1 text-xs text-error animate-fade-in">{error}</p>
        )}
      </div>
    );
  }
);

FloatingSelect.displayName = 'FloatingSelect';
