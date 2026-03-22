import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { SocketProvider } from '@/components/providers/SocketProvider';
import { IntlProvider } from '@/components/providers/IntlProvider';

export const metadata: Metadata = {
  title: 'SwapTrust — Échange sécurisé CFA ↔ RUB',
  description:
    'Plateforme d’échange sécurisé entre francs CFA et roubles russes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        <IntlProvider>
          <AuthProvider>
            <QueryProvider>
              <SocketProvider>{children}</SocketProvider>
            </QueryProvider>
          </AuthProvider>
        </IntlProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
