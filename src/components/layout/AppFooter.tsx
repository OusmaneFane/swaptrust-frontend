import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

const WHATSAPP_ICON_PATH =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';

type AppFooterProps = {
  className?: string;
  /** `light` : pied de page clair (app client). `dark` : fond sombre (admin, opérateur). */
  variant?: 'light' | 'dark';
};

export function AppFooter({ className, variant = 'light' }: AppFooterProps) {
  const dark = variant === 'dark';
  return (
    <footer
      className={cn(
        'backdrop-blur-md',
        dark
          ? 'border-t border-line bg-card/70 text-ink'
          : 'border-t border-primary/10 bg-white/90 text-text-dark',
        className,
      )}
    >
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <Logo variant={dark ? 'dark' : 'light'} size="md" />
            <p
              className={cn(
                'mt-3 text-sm',
                dark ? 'text-ink-secondary' : 'text-text-muted',
              )}
            >
              Taux Google brut, commission séparée, et notifications WhatsApp à chaque étape.
            </p>
            <div
              className={cn(
                'mt-4 flex items-center gap-2 text-xs font-semibold',
                dark ? 'text-ink-secondary' : 'text-text-muted',
              )}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#25D366" aria-hidden>
                <path d={WHATSAPP_ICON_PATH} />
              </svg>
              <span>Notifications WhatsApp en temps réel</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <p
                className={cn(
                  'text-xs font-semibold uppercase tracking-wide',
                  dark ? 'text-ink-muted' : 'text-text-muted',
                )}
              >
                Navigation
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  { href: '/tableau-de-bord', label: 'Tableau de bord' },
                  { href: '/transactions', label: 'Transactions' },
                  { href: '/mes-demandes', label: 'Mes demandes' },
                  { href: '/profil', label: 'Profil' },
                ].map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={cn(
                        'font-semibold',
                        dark
                          ? 'text-ink hover:text-accent'
                          : 'text-primary hover:underline',
                      )}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p
                className={cn(
                  'text-xs font-semibold uppercase tracking-wide',
                  dark ? 'text-ink-muted' : 'text-text-muted',
                )}
              >
                Légal
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    className={cn(
                      'font-semibold',
                      dark
                        ? 'text-ink hover:text-accent'
                        : 'text-primary hover:underline',
                    )}
                  >
                    Conditions
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className={cn(
                      'font-semibold',
                      dark
                        ? 'text-ink hover:text-accent'
                        : 'text-primary hover:underline',
                    )}
                  >
                    Confidentialité
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <p
              className={cn(
                'text-xs font-semibold uppercase tracking-wide',
                dark ? 'text-ink-muted' : 'text-text-muted',
              )}
            >
              Support
            </p>
            <p className={cn('mt-3 text-sm', dark ? 'text-ink-secondary' : 'text-text-muted')}>
              Ajoutez votre numéro WhatsApp dans votre profil pour recevoir les alertes à chaque étape.
            </p>
            <Link href="/profil/modifier" className="mt-5 inline-flex">
              <span className="btn-outline px-5 py-2 text-sm">Ajouter mon WhatsApp</span>
            </Link>
          </div>
        </div>

        <div
          className={cn(
            'mt-10 flex flex-col gap-2 border-t pt-6 text-xs md:flex-row md:items-center md:justify-between',
            dark
              ? 'border-line/80 text-ink-muted'
              : 'border-primary/10 text-text-muted',
          )}
        >
          <span>© {new Date().getFullYear()} DoniSend. Tous droits réservés.</span>
          <span
            className={cn(
              'font-semibold',
              dark ? 'text-ink-secondary' : 'text-text-dark',
            )}
          >
            Taux brut · Commission séparée · WhatsApp à chaque étape
          </span>
        </div>
      </div>
    </footer>
  );
}
