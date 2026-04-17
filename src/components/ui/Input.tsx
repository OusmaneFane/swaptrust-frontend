'use client';

import { forwardRef, type InputHTMLAttributes, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** `surface` : fond clair (client, auth). `dark` : champs sur panneaux sombres (admin). */
  variant?: 'surface' | 'dark';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, variant = 'surface', ...props }, ref) => {
    const uid = useId();
    const inputId = id ?? uid;
    return (
      <div className="relative w-full">
        <input
          ref={ref}
          id={inputId}
          placeholder=" "
          className={cn(
            'peer pt-5 pb-2',
            variant === 'surface' ? 'input-field-surface' : 'input-field',
            error && 'border-danger focus:border-danger focus:ring-danger/15',
            className,
          )}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm transition-all',
            variant === 'surface'
              ? 'text-text-muted peer-focus:text-primary'
              : 'text-ink-faint peer-focus:text-primary',
            'peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-xs',
            'peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs',
          )}
        >
          {label}
        </label>
        {error ? (
          <p className="mt-1 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';
