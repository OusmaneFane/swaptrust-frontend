'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { User } from '@/types/user';

const STORAGE_KEY = 'donisend:dismiss-no-whatsapp-banner';

function hasAnyPhone(user: User): boolean {
  return Boolean(user.phoneMali || user.phoneRussia);
}

export function NoWhatsappBanner({ user }: { user: User }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  if (hasAnyPhone(user) || dismissed) return null;

  return (
    <div className="relative mb-4 flex items-start gap-3 rounded-card border border-warning/25 bg-warning/10 p-4">
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 shrink-0 text-warning"
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
      <div className="min-w-0 flex-1 pr-8">
        <p className="text-sm font-semibold text-warning">Numéro WhatsApp manquant</p>
        <p className="mt-0.5 text-xs text-slate-600">
          Ajoutez un numéro pour recevoir les notifications de vos échanges en temps réel.
        </p>
      </div>
      <Link
        href="/profil/modifier"
        className="shrink-0 rounded-pill border border-warning/35 px-3 py-1.5 text-xs text-warning transition-colors hover:bg-warning/10"
      >
        Ajouter
      </Link>
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem(STORAGE_KEY, '1');
          } catch {
            /* ignore */
          }
          setDismissed(true);
        }}
        className="absolute right-2 top-2 rounded-input p-1 text-text-muted hover:bg-primary/[0.06] hover:text-text-dark"
        aria-label="Fermer l’alerte"
      >
        <span aria-hidden className="text-lg leading-none">
          ×
        </span>
      </button>
    </div>
  );
}
