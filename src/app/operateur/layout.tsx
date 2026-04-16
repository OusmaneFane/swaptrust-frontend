'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, ArrowRightLeft, Menu, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { OperatorGate } from '@/components/operator/OperatorGate';
import { LogoutButton } from '@/components/layout/LogoutButton';
import { Avatar } from '@/components/ui/Avatar';
import { Logo } from '@/components/ui/Logo';
import { AppFooter } from '@/components/layout/AppFooter';
import { cn } from '@/lib/utils';

function OperatorNavLink({
  href,
  label,
  Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-input px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-primary/12 text-primary shadow-sm'
          : 'text-ink-secondary hover:bg-surface-hover hover:text-ink',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

function AdminBackLink() {
  const { data: session } = useSession();
  if (session?.user?.role !== 'ADMIN') return null;
  return (
    <Link
      href="/admin"
      className="block rounded-input border border-primary/25 bg-primary/[0.06] px-3 py-2 text-center text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
    >
      ← Retour administration
    </Link>
  );
}

function OperatorProfileCard() {
  const { data: session } = useSession();
  return (
    <div className="flex items-center gap-3 rounded-input border border-line bg-surface/80 p-3">
      <Avatar
        src={null}
        name={session?.user?.name ?? '?'}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">
          {session?.user?.name ?? 'Opérateur'}
        </p>
        <p className="truncate text-xs text-ink-muted">{session?.user?.email}</p>
      </div>
    </div>
  );
}

export default function OperateurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);

  const nav = (
    <>
      <OperatorNavLink
        href="/operateur"
        Icon={LayoutDashboard}
        label="Tableau de bord"
        onNavigate={() => setDrawer(false)}
      />
      <OperatorNavLink
        href="/operateur/transactions"
        Icon={ArrowRightLeft}
        label="Mes transactions"
        onNavigate={() => setDrawer(false)}
      />
    </>
  );

  return (
    <OperatorGate>
      <div className="flex min-h-screen bg-app font-body">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-card shadow-card lg:flex">
          <div className="border-b border-line p-6">
            <Logo variant="dark" size="md" />
            <span className="mt-2 inline-block rounded-pill bg-accent/15 px-2 py-1 text-xs font-semibold text-accent">
              Mode opérateur
            </span>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-4">{nav}</nav>
          <div className="space-y-3 border-t border-line p-4">
            <AdminBackLink />
            <OperatorProfileCard />
            <LogoutButton className="w-full justify-center" label="always" />
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-card/95 px-4 py-3 shadow-sm backdrop-blur-md lg:hidden">
            <div>
              <p className="font-display text-sm font-bold text-ink">DoniSend</p>
              <span className="text-[10px] font-medium uppercase tracking-wide text-primary">
                Opérateur
              </span>
            </div>
            <button
              type="button"
              className="rounded-input p-2 text-ink-secondary hover:bg-surface-hover"
              aria-label="Menu"
              onClick={() => setDrawer((v) => !v)}
            >
              {drawer ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </header>
          {drawer ? (
            <div className="border-b border-line bg-card px-4 py-4 shadow-card lg:hidden">
              <nav className="flex flex-col gap-1">{nav}</nav>
              <div className="mt-4">
                <AdminBackLink />
                <OperatorProfileCard />
              </div>
              <LogoutButton
                className="mt-3 w-full justify-center"
                label="always"
              />
            </div>
          ) : null}
          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-6xl p-4 lg:p-6">
              {children}
              <AppFooter className="mt-10 hidden lg:block" />
            </div>
          </main>
        </div>
      </div>
    </OperatorGate>
  );
}
