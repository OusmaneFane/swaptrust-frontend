'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  /** Variante visuelle pour fond clair ou admin sombre. */
  variant?: 'light' | 'dark';
  /** `responsive` : texte « Déconnexion » à partir de sm (icône seule sur très petit écran). */
  label?: 'responsive' | 'always';
};

export function LogoutButton({
  className,
  variant = 'light',
  label = 'responsive',
}: Props) {
  async function handleLogout() {
    try {
      const { authApi } = await import('@/services/api');
      await authApi.logout();
    } catch {
      /* ignore — session peut être déjà expirée */
    }
    await signOut({ callbackUrl: '/connexion' });
  }

  return (
    <button
      type="button"
      aria-label="Déconnexion"
      onClick={() => void handleLogout()}
      className={cn(
        'inline-flex items-center gap-2 rounded-input px-2 py-2 text-sm font-medium transition-colors sm:px-3',
        variant === 'light' &&
          'text-text-muted hover:bg-primary/[0.06] hover:text-danger',
        variant === 'dark' &&
          'text-slate-400 hover:bg-slate-800 hover:text-amber-200',
        className,
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden />
      <span className={label === 'always' ? '' : 'hidden sm:inline'}>
        Déconnexion
      </span>
    </button>
  );
}
