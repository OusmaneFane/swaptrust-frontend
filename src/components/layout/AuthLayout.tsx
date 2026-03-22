import type { ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-app">
      <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 animate-blob rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-20 h-80 w-80 animate-blob rounded-full bg-accent/20 blur-3xl [animation-delay:-2s]" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-primary-light/10 blur-3xl" />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
