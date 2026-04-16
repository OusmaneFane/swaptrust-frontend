import type { ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center">
        <div className="mb-8">
          <Logo variant="light" size="lg" />
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
