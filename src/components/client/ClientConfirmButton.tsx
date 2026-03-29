'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClientConfirm } from '@/hooks/useTransaction';

type Props = { transactionId: number };

export function ClientConfirmButton({ transactionId }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const mutation = useClientConfirm(transactionId);

  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-ink-muted">
        Vérifiez votre compte avant de confirmer la réception.
      </p>
      {!showConfirm ? (
        <button
          type="button"
          className="btn-primary w-full"
          onClick={() => setShowConfirm(true)}
        >
          J’ai bien reçu mes fonds
        </button>
      ) : (
        <div className="glass-card space-y-3 border border-danger/30 p-4">
          <p className="text-center font-semibold text-ink">Êtes-vous sûr ?</p>
          <p className="text-center text-sm text-ink-muted">
            Cette action est irréversible. La transaction sera clôturée.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              className="glass-card flex-1 py-3 text-ink-muted"
              onClick={() => setShowConfirm(false)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={mutation.isPending}
              onClick={() =>
                mutation.mutate(undefined, {
                  onSuccess: () => router.push('/tableau-de-bord'),
                })
              }
            >
              {mutation.isPending ? '…' : 'Confirmer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
