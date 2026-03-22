import { cn } from '@/lib/utils';

export function ProgressBar({
  value,
  max = 100,
  className,
}: {
  value: number;
  max?: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-pill bg-muted', className)}
    >
      <div
        className="h-full rounded-pill bg-gradient-to-r from-primary to-accent transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
