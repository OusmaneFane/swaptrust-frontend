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
  Percent,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogoutButton } from '@/components/layout/LogoutButton';
import { Logo } from '@/components/ui/Logo';
import { AppFooter } from '@/components/layout/AppFooter';

const links = [
  { href: '/admin', label: 'Vue d’ensemble', Icon: LayoutDashboard },
  { href: '/admin/demandes', label: 'Demandes à traiter', Icon: Inbox },
  { href: '/admin/commission', label: 'Commission', Icon: Percent },
  { href: '/operateur', label: 'Espace opérateur', Icon: ArrowRightLeft },
  { href: '/admin/kyc', label: 'Vérifications KYC', Icon: BadgeCheck },
  { href: '/admin/utilisateurs', label: 'Utilisateurs', Icon: Users },
  { href: '/admin/operateurs', label: 'Opérateurs', Icon: UserCog },
  { href: '/admin/transactions', label: 'Transactions', Icon: ArrowLeftRight },
  { href: '/admin/platform-accounts', label: 'Comptes DoniSend', Icon: Landmark },
  { href: '/admin/litiges', label: 'Litiges', Icon: Scale },
] as const;

function navLinkClass(active: boolean) {
  return cn(
    'flex items-center gap-3 rounded-input px-3 py-2.5 text-sm font-medium transition-all duration-200',
    active
      ? 'bg-primary/10 text-primary shadow-sm'
      : 'text-text-muted hover:bg-primary/[0.06] hover:text-primary',
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  const isActive = (href: string) => {
    const path = pathname ?? '';
    if (href === '/admin') {
      return path === '/admin' || path === '/admin/';
    }
    if (href === '/operateur') {
      return path === '/operateur' || path.startsWith('/operateur/');
    }
    return path === href || path.startsWith(`${href}/`);
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
    <div className="flex min-h-screen bg-gradient-to-b from-white via-slate-50/50 to-primary/[0.04] font-body text-text-dark">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-primary/10 bg-white/90 shadow-sm backdrop-blur-md lg:flex">
        <div className="border-b border-primary/10 p-5">
          <Link href="/admin" className="group block">
            <div className="flex items-center gap-3 rounded-card bg-gradient-to-br from-primary to-primary-mid p-4 text-white shadow-md shadow-primary/25 transition-transform group-hover:scale-[1.02]">
              <div className="flex h-10 w-10 items-center justify-center rounded-input bg-white/20 backdrop-blur">
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <Logo variant="dark" size="sm" />
                <p className="text-xs font-medium text-white/85">Administration</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">{nav}</div>
        <div className="mt-auto space-y-3 border-t border-primary/10 p-4">
          <LogoutButton className="w-full justify-center" label="always" />
          <Link
            href="/tableau-de-bord"
            className="block text-center text-xs font-medium text-text-muted transition-colors hover:text-primary"
          >
            ← Retour à l’app client
          </Link>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:min-h-0 lg:overflow-hidden">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-primary/10 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-md lg:hidden">
          <span className="font-display text-base font-bold text-text-dark">
            Administration
          </span>
          <button
            type="button"
            className="rounded-input p-2 text-text-muted transition-colors hover:bg-primary/[0.06] hover:text-primary"
            aria-label="Menu"
            onClick={() => setDrawer((v) => !v)}
          >
            {drawer ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>
        <div className="flex gap-1 overflow-x-auto border-b border-primary/10 bg-white/90 px-2 py-2.5 backdrop-blur-md lg:hidden">
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
                    : 'bg-white text-text-muted hover:bg-primary/[0.06] hover:text-primary',
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="max-w-[6.5rem] truncate">{label}</span>
              </Link>
            );
          })}
        </div>
        {drawer ? (
          <div className="space-y-3 border-b border-primary/10 bg-white/95 px-4 py-4 shadow-sm backdrop-blur-md lg:hidden">
            {nav}
            <LogoutButton className="w-full justify-center" label="always" />
          </div>
        ) : null}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-6 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">
            {children}
            <AppFooter variant="dark" className="mt-10 hidden lg:block" />
          </div>
        </main>
      </div>
    </div>
  );
}
