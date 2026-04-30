import { LegalMarkdownPage } from '@/components/legal/LegalMarkdownPage';

export const dynamic = 'force-dynamic';

export default function PrivacyPolicyPage() {
  return (
    <LegalMarkdownPage title="Politique de confidentialité" legalPath="/legal/privacy" />
  );
}

