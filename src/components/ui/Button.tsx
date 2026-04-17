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
        'rounded-pill px-6 py-3 font-semibold text-text-muted transition-all hover:bg-primary/[0.06] hover:text-primary active:scale-95',
      danger:
        'rounded-pill bg-danger px-6 py-3 font-semibold text-white shadow-sm hover:opacity-90 active:scale-95',
      outline:
        'rounded-pill border border-primary/20 bg-white px-6 py-3 font-semibold text-text-dark shadow-sm transition-all hover:border-primary/35 hover:bg-primary/[0.04] active:scale-95',
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
