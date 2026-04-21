import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';
import { Inter, Sora } from 'next/font/google';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { SocketProvider } from '@/components/providers/SocketProvider';
import { IntlProvider } from '@/components/providers/IntlProvider';

const fontBody = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const fontDisplay = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DoniSend — Échange sécurisé CFA ↔ Roubles',
  description:
    'Échangez vos francs CFA contre des roubles russes en toute sécurité. Taux Google en temps réel, commission 2% transparente.',
  keywords: ['échange CFA', 'roubles', 'maliens russie', 'transfert argent', 'donisend'],
  metadataBase: new URL(
    process.env.AUTH_URL ??
      process.env.NEXTAUTH_URL ??
      'http://localhost:3000',
  ),
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'DoniSend — Échange sécurisé CFA ↔ Roubles',
    description:
      'Échangez vos francs CFA contre des roubles russes en toute sécurité. Taux Google en temps réel, commission 2% transparente.',
    images: [{ url: '/opengraph-image', alt: 'DoniSend' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DoniSend — Échange sécurisé CFA ↔ Roubles',
    description:
      'Échangez vos francs CFA contre des roubles russes en toute sécurité. Taux Google en temps réel, commission 2% transparente.',
    images: ['/twitter-image'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${fontBody.variable} ${fontDisplay.variable}`}>
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
