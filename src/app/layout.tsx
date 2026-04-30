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
    'Échangez vos francs CFA contre des roubles russes en toute sécurité. Taux Google en temps réel, commission 5% transparente.',
  keywords: ['échange CFA', 'roubles', 'maliens russie', 'transfert argent', 'donisend'],
  metadataBase: new URL(
    process.env.AUTH_URL ??
      process.env.NEXTAUTH_URL ??
      'https://donisend.com',
  ),
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'DoniSend — Échange sécurisé CFA ↔ Roubles',
    description:
      'Échangez vos francs CFA contre des roubles russes en toute sécurité. Taux Google en temps réel, commission 5% transparente.',
    images: [{ url: '/opengraph-image', alt: 'DoniSend' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DoniSend — Échange sécurisé CFA ↔ Roubles',
    description:
      'Échangez vos francs CFA contre des roubles russes en toute sécurité. Taux Google en temps réel, commission 5% transparente.',
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
