import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** `surface` : carte claire (app client, auth). `glass` : panneau sombre (admin, opérateur). */
  variant?: 'surface' | 'glass';
};

export function Card({
  className,
  variant = 'surface',
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card p-5 shadow-card-lg',
        variant === 'glass'
          ? 'glass-card'
          : 'border border-primary/10 bg-white',
        className,
      )}
      {...props}
    />
  );
}
