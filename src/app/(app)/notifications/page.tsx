'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useNotifications, useMarkAllNotificationsRead } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { fromNow } from '@/lib/utils';

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markAll = useMarkAllNotificationsRead();

  return (
    <div className="mx-auto max-w-lg space-y-6 lg:max-w-xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Notifications</h1>
        <Button
          type="button"
          variant="outline"
          className="text-xs"
          loading={markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          Tout marquer lu
        </Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-card" />
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {(data ?? []).map((n) => (
            <li key={n.id}>
              <Link
                href={n.link ?? '#'}
                className="glass-card flex gap-3 p-4 hover:border-primary/30"
              >
                <Bell className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-ink-muted">{n.body}</p>
                  <p className="mt-1 text-xs text-ink-faint">{fromNow(n.createdAt)}</p>
                </div>
                {!n.read ? (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-danger" />
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!isLoading && !(data ?? []).length ? (
        <p className="text-center text-sm text-ink-muted">Aucune notification.</p>
      ) : null}
    </div>
  );
}
