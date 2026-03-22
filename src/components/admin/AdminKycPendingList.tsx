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
    mutationFn: (id: number) => kycApi.approve(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['admin', 'kyc', 'pending'] });
      const prev = qc.getQueryData<KycDocument[]>(['admin', 'kyc', 'pending']);
      qc.setQueryData<KycDocument[]>(
        ['admin', 'kyc', 'pending'],
        (old) => old?.filter((d) => d.id !== id) ?? [],
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
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
    mutationFn: ({ id, note }: { id: number; note: string }) =>
      kycApi.reject(id, note),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ['admin', 'kyc', 'pending'] });
      const prev = qc.getQueryData<KycDocument[]>(['admin', 'kyc', 'pending']);
      qc.setQueryData<KycDocument[]>(
        ['admin', 'kyc', 'pending'],
        (old) => old?.filter((d) => d.id !== id) ?? [],
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
      <div className="rounded-input border border-dashed border-line bg-surface/80 px-4 py-8 text-center">
        <p className="text-sm text-ink-muted">Aucun dossier en attente de validation.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {pending.map((doc) => (
        <li
          key={doc.id}
          className={cn(
            'flex flex-col gap-3 rounded-card border border-line bg-surface/50 p-4 text-sm shadow-sm transition-shadow hover:shadow-card sm:flex-row sm:flex-wrap sm:items-center sm:justify-between',
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold text-ink">Dossier #{doc.id}</p>
            <p className="mt-0.5 text-ink-secondary">
              Utilisateur #{doc.userId} ·{' '}
              <span className="font-medium text-ink">{doc.docType}</span>
            </p>
            <p className="mt-1 text-xs text-ink-faint">
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
              onClick={() => approveMut.mutate(doc.id)}
            >
              Approuver
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-danger/35 py-2 text-xs text-danger hover:bg-danger/5"
              loading={rejectMut.isPending}
              onClick={() => {
                const note = window.prompt('Motif du rejet ?') ?? '';
                if (note.trim()) rejectMut.mutate({ id: doc.id, note });
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
