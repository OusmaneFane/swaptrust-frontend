import { LegalMarkdownPage } from '@/components/legal/LegalMarkdownPage';

export const dynamic = 'force-dynamic';

export default function TermsPage() {
  return <LegalMarkdownPage title="Conditions d’utilisation" legalPath="/legal/terms" />;
}

