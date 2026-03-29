'use client';

import type { UserRole } from '@/types/user';
import { cn } from '@/lib/utils';

const styles: Record<UserRole, string> = {
  CLIENT: 'bg-muted text-ink-muted',
  OPERATOR: 'bg-primary/15 text-primary',
  ADMIN: 'bg-amber-500/15 text-amber-800',
};

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-pill px-2 py-0.5 text-xs font-semibold',
        styles[role],
      )}
    >
      {role}
    </span>
  );
}
