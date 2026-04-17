'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ListOrdered,
  ArrowLeftRight,
  User,
  Bell,
} from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { BottomNavBar } from '@/components/layout/BottomNavBar';
import { LogoutButton } from '@/components/layout/LogoutButton';
import { KycGate } from '@/components/layout/KycGate';
import { AppFooter } from '@/components/layout/AppFooter';
import { cn } from '@/lib/utils';

const side = [
  { href: '/tableau-de-bord', label: 'Tableau de bord', Icon: LayoutDashboard },
  { href: '/mes-demandes', label: 'Mes demandes', Icon: ListOrdered },
  { href: '/transactions', label: 'Transactions', Icon: ArrowLeftRight },
  { href: '/notifications', label: 'Notifications', Icon: Bell },
  { href: '/profil', label: 'Profil', Icon: User },
] as const;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideBottomNav = pathname.includes('/chat');
  return (
    <KycGate>
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white via-slate-50/50 to-primary/[0.04] text-text-dark">
      <div className="hidden lg:block">
        <TopBar />
      </div>
      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-primary/10 bg-white/90 px-3 py-6 shadow-sm backdrop-blur-md lg:flex">
          <span className="mb-6 px-3 font-display text-sm font-semibold uppercase tracking-wide text-text-muted">
            Menu
          </span>
          <nav className="flex flex-col gap-1">
            {side.map(({ href, label, Icon }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-input px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-text-muted hover:bg-primary/[0.06] hover:text-primary',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-primary/10 pt-4">
            <LogoutButton
              className="w-full justify-center"
              label="always"
            />
          </div>
        </aside>
        <div className="flex flex-1 flex-col">
          <div className="lg:hidden">
            <TopBar />
          </div>
          <main className="flex-1 px-4 pt-4 lg:px-8 lg:pb-0">
            <div className={hideBottomNav ? 'pb-8' : 'pb-24'}>
              {children}
            </div>
            <AppFooter className="mt-10 hidden lg:block" />
          </main>
        </div>
      </div>
      {hideBottomNav ? null : <BottomNavBar />}
    </div>
    </KycGate>
  );
}
