import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold text-text-muted">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-text-dark">
        Page introuvable
      </h1>
      <p className="mt-3 text-sm text-text-secondary">
        La page demandée n’existe pas ou a été déplacée.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link
          href="/"
          className="rounded-full border border-primary/15 bg-primary/[0.06] px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/[0.1]"
        >
          Accueil
        </Link>
        <Link
          href="/tableau-de-bord"
          className="rounded-full border border-primary/15 bg-white px-5 py-2.5 text-sm font-semibold text-text-dark shadow-sm transition hover:bg-primary/[0.04]"
        >
          Tableau de bord
        </Link>
      </div>
    </div>
  );
}

