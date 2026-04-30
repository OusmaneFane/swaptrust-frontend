'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Logo } from '@/components/ui/Logo';
import { getApiBaseUrl } from '@/lib/api-base';

type LegalMarkdownPageProps = {
  title: string;
  /** ex: "/legal/privacy" */
  legalPath: string;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; markdown: string };

function isHttpUrl(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function extractLastUpdated(markdown: string): string | null {
  // Exemple: "Dernière mise à jour : 2026-04-27"
  const m = markdown.match(/^\s*Dernière\s+mise\s+à\s+jour\s*:\s*(.+)\s*$/im);
  if (!m?.[1]) return null;
  return m[1].trim();
}

function coerceMarkdownFromResponse(raw: string): string {
  // Backend spec says "text/markdown", but we also support the app's common `{ data, success }` envelope.
  const t = raw.trim();
  if (!t) return raw;
  if (t.startsWith('{') && t.endsWith('}')) {
    try {
      const parsed = JSON.parse(t) as unknown;
      if (
        parsed &&
        typeof parsed === 'object' &&
        'data' in parsed &&
        typeof (parsed as { data?: unknown }).data === 'string'
      ) {
        return (parsed as { data: string }).data;
      }
    } catch {
      // fall back to raw text
    }
  }
  return raw;
}

export function LegalMarkdownPage({ title, legalPath }: LegalMarkdownPageProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const url = useMemo(() => {
    const base = getApiBaseUrl().replace(/\/+$/, '');
    const path = `/${String(legalPath ?? '').replace(/^\/+/, '')}`;
    return `${base}${path}`;
  }, [legalPath]);

  const load = useCallback(async () => {
    try {
      setState({ status: 'loading' });
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'text/markdown' },
        cache: 'no-store',
      });
      if (!res.ok) {
        setState({
          status: 'error',
          message: `Impossible de charger le document (HTTP ${res.status}).`,
        });
        return;
      }
      const raw = await res.text();
      const markdown = coerceMarkdownFromResponse(raw);
      setState({ status: 'ready', markdown });
    } catch {
      setState({
        status: 'error',
        message: "Erreur réseau — vérifiez votre connexion puis réessayez.",
      });
    }
  }, [url]);

  useEffect(() => {
    void load();
  }, [load]);

  const lastUpdated =
    state.status === 'ready' ? extractLastUpdated(state.markdown) : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-white to-surface px-4 py-10">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-52 right-[-120px] h-[560px] w-[560px] rounded-full bg-accent/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-3xl">
        <div className="flex items-center justify-center">
          <Link href="/" aria-label="DoniSend — Accueil" className="inline-flex">
            <Logo size="lg" variant="light" className="drop-shadow-sm" />
          </Link>
        </div>

        <Card className="mt-8 p-7 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Légal
              </p>
              <h1 className="font-display text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
                {title}
              </h1>
              <p className="max-w-prose text-sm text-text-secondary">
                Consultez ce document, puis revenez à l’application quand vous êtes prêt.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="muted">Public</Badge>
              {lastUpdated ? <Badge tone="default">Maj {lastUpdated}</Badge> : null}
              <Button variant="outline" onClick={() => void load()}>
                Recharger
              </Button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs">
            <Link href="/terms" className="font-semibold text-primary hover:underline">
              CGU
            </Link>
            <span className="text-ink-muted">·</span>
            <Link
              href="/privacy-policy"
              className="font-semibold text-primary hover:underline"
            >
              Confidentialité
            </Link>
            <span className="text-ink-muted">·</span>
            <Link
              href="/disclaimer"
              className="font-semibold text-primary hover:underline"
            >
              Disclaimer
            </Link>
            <span className="text-ink-muted">·</span>
            <Link href="/profil" className="font-semibold text-primary hover:underline">
              Contact
            </Link>
          </div>

          {state.status === 'loading' ? (
            <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
              <div className="h-4 w-56 animate-pulse rounded bg-slate-200/80" />
              <div className="mt-4 space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-slate-200/70" />
                <div className="h-3 w-11/12 animate-pulse rounded bg-slate-200/70" />
                <div className="h-3 w-10/12 animate-pulse rounded bg-slate-200/70" />
              </div>
            </div>
          ) : state.status === 'error' ? (
            <div className="mt-6 rounded-2xl border border-danger/20 bg-red-50/60 p-6 text-sm text-danger">
              <p className="font-semibold">{state.message}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={() => void load()}>Réessayer</Button>
                <Link href="/" className="inline-flex">
                  <Button variant="outline">Retour à l’accueil</Button>
                </Link>
              </div>
            </div>
          ) : (
            <article className="mt-6 rounded-2xl border border-line bg-white p-6 sm:p-8">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h2 className="mt-2 font-display text-xl font-bold text-text-dark sm:text-2xl">
                      {children}
                    </h2>
                  ),
                  h2: ({ children }) => (
                    <h3 className="mt-7 scroll-mt-24 font-display text-lg font-bold text-text-dark">
                      {children}
                    </h3>
                  ),
                  h3: ({ children }) => (
                    <h4 className="mt-6 scroll-mt-24 text-base font-bold text-text-dark">
                      {children}
                    </h4>
                  ),
                  p: ({ children }) => (
                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-text-secondary">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-text-secondary">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  hr: () => <hr className="my-6 border-line" />,
                  a: ({ href, children }) => {
                    const h = String(href ?? '');
                    if (isHttpUrl(h)) {
                      return (
                        <a
                          href={h}
                          className="font-semibold text-primary hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {children}
                        </a>
                      );
                    }
                    return (
                      <Link
                        href={h}
                        className="font-semibold text-primary hover:underline"
                      >
                        {children}
                      </Link>
                    );
                  },
                  blockquote: ({ children }) => (
                    <blockquote className="mt-4 rounded-xl border border-primary/10 bg-primary/[0.04] p-4 text-text-secondary">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children }) => (
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.92em] text-slate-800">
                      {children}
                    </code>
                  ),
                }}
              >
                {state.markdown}
              </ReactMarkdown>
            </article>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">
                Retour à l’accueil
              </Button>
            </Link>
            <div className="text-center text-xs text-ink-muted sm:text-right">
              DoniSend — échange sécurisé CFA ↔ RUB
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

