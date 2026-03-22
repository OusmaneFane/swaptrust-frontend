'use client';

import { cn } from '@/lib/utils';

export function StepIndicator({
  step,
  total,
  labels,
}: {
  step: number;
  total: number;
  labels: string[];
}) {
  return (
    <div className="flex w-full gap-2">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const done = n < step;
        const current = n === step;
        return (
          <div key={n} className="flex-1">
            <div
              className={cn(
                'h-1.5 rounded-pill transition-colors',
                done || current ? 'bg-primary' : 'bg-muted',
                current && 'animate-pulse-slow',
              )}
            />
            <p
              className={cn(
                'mt-1.5 truncate text-[10px] md:text-xs',
                current ? 'font-medium text-primary' : 'text-ink-faint',
              )}
            >
              {labels[i] ?? `Étape ${n}`}
            </p>
          </div>
        );
      })}
    </div>
  );
}
