'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { operatorApi } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProofViewer } from '@/components/shared/ProofViewer';
import { formatCFA, formatRUB, fullDate } from '@/lib/utils';
import { TRANSACTION_STEPS } from '@/types/transaction';
import type { OperatorLog, OperatorLogAction } from '@/types';
import { PAYMENT_METHOD_LABELS } from '@/constants/payment-methods';

const ACTION_LABEL: Record<OperatorLogAction, string> = {
  TAKEN: 'Pris en charge',
  CLIENT_PROOF_VIEWED: 'Reçu client consulté',
  OPERATOR_SENT: 'Envoi opérateur',
  COMPLETED: 'Clôturé',
  NOTE: 'Note',
};

export default function OperateurTransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const id = Number(params.id);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const { data: tx, isLoading, isError } = useQuery({
    queryKey: ['operator', 'transaction', id],
    queryFn: () => operatorApi.getTransactionDetail(id),
    enabled: Number.isFinite(id),
    refetchInterval: 10_000,
  });

  const verifyMut = useMutation({
    mutationFn: () => operatorApi.verifyClientProof(id),
    onSuccess: () => {
      toast.success('Reçu validé');
      void qc.invalidateQueries({ queryKey: ['operator', 'transaction', id] });
    },
    onError: () => toast.error('Action impossible'),
  });

  const sendMut = useMutation({
    mutationFn: (file: File) => operatorApi.operatorSend(id, file),
    onSuccess: () => {
      toast.success('Reçu envoyé — en attente du client');
      setProofFile(null);
      void qc.invalidateQueries({ queryKey: ['operator', 'transaction', id] });
      void qc.invalidateQueries({ queryKey: ['operator', 'transactions'] });
    },
    onError: () => toast.error('Envoi impossible'),
  });

  const addNote = useMutation({
    mutationFn: (note: string) => operatorApi.addNote(id, note),
    onSuccess: () => {
      toast.success('Note enregistrée');
      void qc.invalidateQueries({ queryKey: ['operator', 'transaction', id] });
    },
    onError: () => toast.error('Impossible d’ajouter la note'),
  });

  const cancelMut = useMutation({
    mutationFn: (reason: string) => operatorApi.cancel(id, reason),
    onSuccess: () => {
      toast.success('Transaction annulée');
      void qc.invalidateQueries({ queryKey: ['operator'] });
      router.push('/operateur');
    },
    onError: () => toast.error('Annulation impossible'),
  });

  if (!Number.isFinite(id)) {
    return <p className="text-sm text-ink-muted">Transaction invalide.</p>;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (isError || !tx) {
    return (
      <div className="text-center">
        <p className="text-sm text-ink-muted">Transaction introuvable.</p>
        <Link
          href="/operateur/transactions"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          ← Retour
        </Link>
      </div>
    );
  }

  const meta = TRANSACTION_STEPS[tx.status];
  const req = tx.request;

  function onAddNote() {
    const note = window.prompt('Note interne :') ?? '';
    if (note.trim()) addNote.mutate(note.trim());
  }

  function onCancel() {
    const reason = window.prompt('Motif d’annulation :') ?? '';
    if (reason.trim()) cancelMut.mutate(reason.trim());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/operateur/transactions"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Mes transactions
        </Link>
        <Badge tone="muted">{meta.label}</Badge>
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Transaction #{tx.id}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {tx.takenAt ? `Prise en charge ${fullDate(tx.takenAt)}` : '—'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3 border-line/90 p-4">
          <p className="text-xs font-semibold uppercase text-ink-muted">Client</p>
          <p className="font-semibold text-ink">{tx.client.name}</p>
          <p className="text-sm text-ink-secondary">
            Réception : {tx.clientReceiveNumber ?? req?.phoneToSend ?? '—'}
          </p>
          <p className="text-sm text-ink-muted">
            {formatCFA(tx.amountCfa)} · {formatRUB(tx.amountRub)}
          </p>
          {req ? (
            <p className="text-xs text-ink-faint">
              Demande #{req.id} · {PAYMENT_METHOD_LABELS[req.paymentMethod]}
            </p>
          ) : null}
        </Card>
        <Card className="space-y-3 border-line/90 p-4">
          <p className="text-xs font-semibold uppercase text-ink-muted">Vous</p>
          <p className="font-semibold text-ink">{tx.operator.name}</p>
          <p className="text-sm text-ink-secondary">
            Numéro communiqué au client :{' '}
            <span className="font-mono text-ink">
              {tx.operatorPaymentNumber ?? '—'}
            </span>
          </p>
          {tx.operatorNote ? (
            <p className="text-xs text-ink-muted">Note : {tx.operatorNote}</p>
          ) : null}
        </Card>
      </div>

      <Card className="border-dashed border-line p-4">
        <p className="text-sm font-medium text-ink">Statut</p>
        <p className="text-sm text-ink-secondary">{tx.status} — {meta.description}</p>
      </Card>

      {tx.clientProofUrl ? (
        <section>
          <h2 className="mb-2 font-display text-lg font-semibold text-ink">
            Reçu du client
          </h2>
          <ProofViewer url={tx.clientProofUrl} label="Reçu client" />
          {tx.clientSentAt ? (
            <p className="mt-2 text-xs text-ink-faint">
              Reçu signalé {fullDate(tx.clientSentAt)}
            </p>
          ) : null}
        </section>
      ) : null}

      {tx.status === 'CLIENT_SENT' ? (
        <Card className="space-y-4 border-primary/25 bg-primary/[0.04] p-5">
          <h2 className="font-semibold text-ink">Action requise</h2>
          <p className="text-sm text-ink-secondary">
            Vérifiez le reçu client avant de préparer l’envoi.
          </p>
          <Button
            type="button"
            className="w-full"
            loading={verifyMut.isPending}
            onClick={() => verifyMut.mutate()}
          >
            J’ai vérifié le reçu client
          </Button>
        </Card>
      ) : null}

      {tx.status === 'OPERATOR_VERIFIED' ? (
        <Card className="space-y-4 border-primary/25 bg-primary/[0.04] p-5">
          <h2 className="font-semibold text-ink">Envoi au client</h2>
          <p className="text-sm text-ink-secondary">
            Envoyez les fonds puis joignez la capture de votre preuve d’envoi.
          </p>
          <div className="space-y-2">
            <label className="block text-sm text-ink-muted">
              Preuve de votre envoi (image)
            </label>
            <input
              type="file"
              accept="image/*"
              className="text-sm"
              onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              className="w-full"
              disabled={!proofFile || sendMut.isPending}
              loading={sendMut.isPending}
              onClick={() => proofFile && sendMut.mutate(proofFile)}
            >
              Confirmer l’envoi + preuve
            </Button>
          </div>
        </Card>
      ) : null}

      {tx.operatorProofUrl ? (
        <section>
          <h2 className="mb-2 font-display text-lg font-semibold text-ink">
            Votre preuve d’envoi
          </h2>
          <ProofViewer url={tx.operatorProofUrl} label="Votre reçu" />
        </section>
      ) : null}

      <Link
        href={`/transactions/${id}/chat`}
        className="glass-card block p-4 text-center text-sm font-medium text-primary hover:border-primary/30"
      >
        Ouvrir le chat avec le client →
      </Link>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">
          Journal
        </h2>
        <ul className="space-y-2 border-l-2 border-line pl-4">
          {(tx.operatorLogs ?? []).length ? (
            tx.operatorLogs.map((log: OperatorLog) => (
              <li key={log.id} className="text-sm">
                <span className="text-ink-faint">{fullDate(log.createdAt)}</span>{' '}
                <span className="font-medium text-primary">
                  {ACTION_LABEL[log.action]}
                </span>
                {log.note ? (
                  <span className="text-ink-secondary"> — {log.note}</span>
                ) : null}
              </li>
            ))
          ) : (
            <li className="text-sm text-ink-muted">Aucune entrée.</li>
          )}
        </ul>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        {tx.status !== 'COMPLETED' && tx.status !== 'CANCELLED' ? (
          <>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              loading={addNote.isPending}
              onClick={onAddNote}
            >
              Ajouter une note
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-danger"
              loading={cancelMut.isPending}
              onClick={onCancel}
            >
              Annuler la transaction
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
