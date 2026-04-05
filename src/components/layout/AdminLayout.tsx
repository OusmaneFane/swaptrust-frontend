'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  ArrowRightLeft,
  Scale,
  Menu,
  X,
  BadgeCheck,
  Sparkles,
  UserCog,
  Landmark,
  Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogoutButton } from '@/components/layout/LogoutButton';

const links = [
  { href: '/admin', label: 'Vue d’ensemble', Icon: LayoutDashboard },
  { href: '/admin/demandes', label: 'Demandes à traiter', Icon: Inbox },
  { href: '/operateur', label: 'Espace opérateur', Icon: ArrowRightLeft },
  { href: '/admin/kyc', label: 'Vérifications KYC', Icon: BadgeCheck },
  { href: '/admin/utilisateurs', label: 'Utilisateurs', Icon: Users },
  { href: '/admin/operateurs', label: 'Opérateurs', Icon: UserCog },
  { href: '/admin/transactions', label: 'Transactions', Icon: ArrowLeftRight },
  { href: '/admin/platform-accounts', label: 'Comptes SwapTrust', Icon: Landmark },
  { href: '/admin/litiges', label: 'Litiges', Icon: Scale },
] as const;

function navLinkClass(active: boolean) {
  return cn(
    'flex items-center gap-3 rounded-input px-3 py-2.5 text-sm font-medium transition-all duration-200',
    active
      ? 'bg-primary/12 text-primary shadow-sm ring-1 ring-primary/15'
      : 'text-ink-secondary hover:bg-surface-hover hover:text-ink',
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin' || pathname === '/admin/';
    }
    if (href === '/operateur') {
      return pathname === '/operateur' || pathname.startsWith('/operateur/');
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const nav = (
    <nav className="flex flex-col gap-1">
      {links.map(({ href, label, Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setDrawer(false)}
            className={navLinkClass(active)}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0',
                active ? 'text-primary' : 'text-ink-muted',
              )}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-app font-body">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-card shadow-card lg:flex">
        <div className="border-b border-line p-5">
          <Link href="/admin" className="group block">
            <div className="flex items-center gap-3 rounded-card bg-gradient-to-br from-primary to-primary-dark p-4 text-white shadow-md shadow-primary/25 transition-transform group-hover:scale-[1.02]">
              <div className="flex h-10 w-10 items-center justify-center rounded-input bg-white/20 backdrop-blur">
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="font-display text-sm font-bold leading-tight">
                  SwapTrust
                </p>
                <p className="text-xs font-medium text-white/85">Administration</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">{nav}</div>
        <div className="mt-auto space-y-3 border-t border-line p-4">
          <LogoutButton className="w-full justify-center" label="always" />
          <Link
            href="/tableau-de-bord"
            className="block text-center text-xs font-medium text-ink-muted transition-colors hover:text-primary"
          >
            ← Retour à l’app client
          </Link>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:min-h-0 lg:overflow-hidden">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card/95 px-4 py-3 shadow-sm backdrop-blur-md lg:hidden">
          <span className="font-display text-base font-bold text-ink">
            Administration
          </span>
          <button
            type="button"
            className="rounded-input p-2 text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink"
            aria-label="Menu"
            onClick={() => setDrawer((v) => !v)}
          >
            {drawer ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>
        <div className="flex gap-1 overflow-x-auto border-b border-line bg-card px-2 py-2.5 lg:hidden">
          {links.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-2 text-xs font-semibold transition-colors',
                  active
                    ? 'bg-primary text-white shadow-sm shadow-primary/25'
                    : 'bg-surface text-ink-secondary hover:bg-muted',
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="max-w-[6.5rem] truncate">{label}</span>
              </Link>
            );
          })}
        </div>
        {drawer ? (
          <div className="space-y-3 border-b border-line bg-card px-4 py-4 shadow-card lg:hidden">
            {nav}
            <LogoutButton className="w-full justify-center" label="always" />
          </div>
        ) : null}
        <main className="flex-1 overflow-auto bg-gradient-to-b from-transparent via-app to-primary/[0.03] px-4 py-6 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
