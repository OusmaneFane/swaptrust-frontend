import type { ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col items-center justify-center sm:max-w-md">
        <div className="mb-8 flex w-full justify-center">
          <Logo variant="light" size="lg" className="mx-auto max-w-full" />
        </div>
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
