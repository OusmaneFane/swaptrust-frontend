'use client';

import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import fr from '@/messages/fr.json';

export function IntlProvider({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="fr" messages={fr}>
      {children}
    </NextIntlClientProvider>
  );
}
