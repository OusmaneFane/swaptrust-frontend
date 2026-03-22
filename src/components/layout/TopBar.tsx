'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { LogoutButton } from '@/components/layout/LogoutButton';
import { useSession } from 'next-auth/react';
import { Avatar } from '@/components/ui/Avatar';
import { useNotificationStore } from '@/stores/notificationStore';
import { cn } from '@/lib/utils';

export function TopBar({ className }: { className?: string }) {
  const { data } = useSession();
  const unread = useNotificationStore((s) => s.unreadCount);
  const user = data?.user;

  return (
    <header
      className={cn(
        'flex items-center justify-between gap-4 border-b border-line bg-card/90 px-4 py-3 shadow-sm backdrop-blur-md lg:px-8',
        className,
      )}
    >
      <Link
        href="/tableau-de-bord"
        className="font-display text-lg font-bold tracking-tight text-ink"
      >
        Swap<span className="text-primary">Trust</span>
      </Link>
      <div className="flex items-center gap-3">
        {user?.isAdmin ? (
          <Link
            href="/admin"
            className="hidden rounded-pill border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800 md:inline"
          >
            Admin
          </Link>
        ) : null}
        <Link
          href="/notifications"
          className="relative rounded-full p-2 text-ink-secondary transition-colors hover:bg-surface-hover hover:text-primary"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 ? (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger ring-2 ring-card" />
          ) : null}
        </Link>
        <Link
          href="/profil"
          className="flex items-center gap-2 rounded-pill border border-transparent py-1 pl-1 pr-3 transition-colors hover:border-line hover:bg-surface"
        >
          <Avatar
            src={null}
            name={user?.name ?? user?.email ?? '?'}
            size="sm"
          />
          <span className="hidden max-w-[120px] truncate text-sm font-medium text-ink-secondary md:inline">
            {user?.name ?? user?.email}
          </span>
        </Link>
        <LogoutButton />
      </div>
    </header>
  );
}
