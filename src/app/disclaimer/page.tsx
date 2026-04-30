import { LegalMarkdownPage } from '@/components/legal/LegalMarkdownPage';

export const dynamic = 'force-dynamic';

export default function DisclaimerPage() {
  return <LegalMarkdownPage title="Disclaimer" legalPath="/legal/disclaimer" />;
}

