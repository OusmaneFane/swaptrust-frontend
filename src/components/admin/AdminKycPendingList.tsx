'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { kycApi } from '@/services/api';
import type { KycDocument } from '@/types/api-dtos';
import { cn } from '@/lib/utils';

type Props = {
  pending: KycDocument[];
  compact?: boolean;
};

export function AdminKycPendingList({ pending, compact }: Props) {
  const qc = useQueryClient();

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'kyc', 'pending'] });
    void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  };

  const approveMut = useMutation({
    mutationFn: (userId: number) => kycApi.approve(userId),
    onMutate: async (userId) => {
      await qc.cancelQueries({ queryKey: ['admin', 'kyc', 'pending'] });
      const prev = qc.getQueryData<KycDocument[]>(['admin', 'kyc', 'pending']);
      qc.setQueryData<KycDocument[]>(
        ['admin', 'kyc', 'pending'],
        (old) => old?.filter((d) => d.userId !== userId) ?? [],
      );
      return { prev };
    },
    onError: (_e, _userId, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(['admin', 'kyc', 'pending'], ctx.prev);
      }
      toast.error('Approbation impossible');
    },
    onSuccess: () => {
      toast.success('KYC approuvé');
      invalidate();
    },
  });

  const rejectMut = useMutation({
    mutationFn: ({ userId, note }: { userId: number; note?: string }) =>
      kycApi.reject(userId, note),
    onMutate: async ({ userId }) => {
      await qc.cancelQueries({ queryKey: ['admin', 'kyc', 'pending'] });
      const prev = qc.getQueryData<KycDocument[]>(['admin', 'kyc', 'pending']);
      qc.setQueryData<KycDocument[]>(
        ['admin', 'kyc', 'pending'],
        (old) => old?.filter((d) => d.userId !== userId) ?? [],
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(['admin', 'kyc', 'pending'], ctx.prev);
      }
      toast.error('Rejet impossible');
    },
    onSuccess: () => {
      toast.success('KYC rejeté');
      invalidate();
    },
  });

  if (!pending.length) {
    return (
      <div className="rounded-input border border-dashed border-primary/15 bg-white px-4 py-8 text-center shadow-sm">
        <p className="text-sm text-text-muted">
          Aucun dossier en attente de validation.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {pending.map((doc) => (
        <li
          key={doc.id}
          className={cn(
            'flex flex-col gap-3 rounded-card border border-primary/10 bg-white p-4 text-sm shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:flex-wrap sm:items-center sm:justify-between',
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold text-text-dark">
              Dossier #{doc.id}
            </p>
            <p className="mt-0.5 text-text-secondary">
              Utilisateur #{doc.userId} ·{' '}
              <span className="font-medium text-text-dark">{doc.docType}</span>
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Soumis le {new Date(doc.submittedAt).toLocaleString('fr-FR')}
            </p>
            {!compact &&
            (doc.frontUrl || doc.backUrl || doc.selfieUrl) ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {doc.frontUrl ? (
                  <a
                    href={doc.frontUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-pill bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/15"
                  >
                    Recto <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
                {doc.backUrl ? (
                  <a
                    href={doc.backUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-pill bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/15"
                  >
                    Verso <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
                {doc.selfieUrl ? (
                  <a
                    href={doc.selfieUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-pill bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/15"
                  >
                    Selfie <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              className="py-2 text-xs shadow-sm"
              loading={approveMut.isPending}
              onClick={() => approveMut.mutate(doc.userId)}
            >
              Approuver
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-danger/35 py-2 text-xs text-danger hover:bg-danger/5"
              loading={rejectMut.isPending}
              onClick={() => {
                const note = window.prompt('Motif du rejet ? (optionnel)') ?? '';
                rejectMut.mutate({ userId: doc.userId, note: note.trim() || undefined });
              }}
            >
              Rejeter
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
