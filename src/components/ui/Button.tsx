import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      loading,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const variants = {
      primary: 'btn-primary disabled:opacity-50 disabled:pointer-events-none',
      ghost:
        'rounded-pill px-6 py-3 font-semibold text-ink-secondary transition-all hover:bg-surface-hover active:scale-95',
      danger:
        'rounded-pill bg-danger px-6 py-3 font-semibold text-white shadow-sm hover:opacity-90 active:scale-95',
      outline:
        'rounded-pill border border-line bg-card px-6 py-3 font-semibold text-ink shadow-sm transition-all hover:border-primary/40 hover:bg-surface active:scale-95',
    };
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(variants[variant], className)}
        {...props}
      >
        {loading ? '…' : children}
      </button>
    );
  },
);
Button.displayName = 'Button';
