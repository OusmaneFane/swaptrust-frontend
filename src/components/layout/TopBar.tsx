'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { LogoutButton } from '@/components/layout/LogoutButton';
import { useSession } from 'next-auth/react';
import { Avatar } from '@/components/ui/Avatar';
import { Logo } from '@/components/ui/Logo';
import { useNotificationStore } from '@/stores/notificationStore';
import { cn } from '@/lib/utils';

export function TopBar({ className }: { className?: string }) {
  const { data } = useSession();
  const unread = useNotificationStore((s) => s.unreadCount);
  const user = data?.user;

  return (
    <header
      className={cn(
        'flex items-center justify-between gap-4 border-b border-primary/10 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-md lg:px-8',
        className,
      )}
    >
      <Link
        href="/tableau-de-bord"
        className="inline-flex items-center"
        aria-label="DoniSend"
      >
        <Logo variant="light" size="md" />
      </Link>
      <div className="flex items-center gap-3">
        {user?.role === 'ADMIN' ? (
          <Link
            href="/admin"
            className="hidden rounded-pill border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800 md:inline"
          >
            Admin
          </Link>
        ) : null}
        {user?.role === 'OPERATOR' ? (
          <Link
            href="/operateur"
            className="hidden rounded-pill border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary md:inline"
          >
            Opérateur
          </Link>
        ) : null}
        <Link
          href="/notifications"
          className="relative rounded-full p-2 text-text-muted transition-colors hover:bg-primary/[0.06] hover:text-primary"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 ? (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
          ) : null}
        </Link>
        <Link
          href="/profil"
          className="flex items-center gap-2 rounded-pill border border-transparent py-1 pl-1 pr-3 transition-colors hover:border-primary/15 hover:bg-primary/[0.04]"
        >
          <Avatar
            src={null}
            name={user?.name ?? user?.email ?? '?'}
            size="sm"
          />
          <span className="hidden max-w-[120px] truncate text-sm font-medium text-text-muted md:inline">
            {user?.name ?? user?.email}
          </span>
        </Link>
        <LogoutButton />
      </div>
    </header>
  );
}
