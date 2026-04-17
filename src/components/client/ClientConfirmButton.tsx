'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClientConfirm } from '@/hooks/useTransaction';

type Props = {
  transactionId: number;
  onWhatsappNotify?: () => void;
};

export function ClientConfirmButton({ transactionId, onWhatsappNotify }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const mutation = useClientConfirm(transactionId);

  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-text-muted">
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
        <div className="space-y-3 rounded-card border border-danger/30 bg-red-50/50 p-4 shadow-card">
          <p className="text-center font-semibold text-text-dark">Êtes-vous sûr ?</p>
          <p className="text-center text-sm text-text-muted">
            Cette action est irréversible. La transaction sera clôturée.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              className="flex-1 rounded-input border border-primary/15 bg-white py-3 text-text-muted shadow-sm transition hover:bg-slate-50"
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
                  onSuccess: () => {
                    onWhatsappNotify?.();
                    router.push('/tableau-de-bord');
                  },
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
