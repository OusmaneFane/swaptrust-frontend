import { Suspense } from 'react';
import { ConnexionForm } from './ConnexionForm';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

function Fallback() {
  return (
    <Card className="space-y-4 p-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </Card>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ConnexionForm />
    </Suspense>
  );
}
