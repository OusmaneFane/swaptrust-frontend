'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
  MessageCircle,
  AlertTriangle,
  Star,
  Copy,
  Check,
} from 'lucide-react';
import { TransactionTimeline } from '@/components/exchange/TransactionTimeline';
import { ClientSendButton } from '@/components/client/ClientSendButton';
import { ClientConfirmButton } from '@/components/client/ClientConfirmButton';
import { ProofViewer } from '@/components/shared/ProofViewer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { useTransaction } from '@/hooks/useTransaction';
import { resolveClientSendDestination } from '@/lib/resolve-client-send-destination';
import { rubDisplayFor1000Cfa } from '@/lib/rate-xof-rub';
import { formatAccountForDisplay } from '@/lib/swaptrust-receive';
import {
  formatGrossSendForClient,
  formatMinorForSendRail,
} from '@/lib/transaction-display';
import { formatCFA, formatRUB } from '@/lib/utils';
import { sameUserId } from '@/lib/same-user';
import { authApi, transactionsApi, reviewsApi } from '@/services/api';
import { toast } from 'sonner';
import { showWhatsappToast } from '@/components/ui/WhatsappToast';
import { userWhatsappNotifyPhone } from '@/lib/user-phones';

function CopyableAccountValue({ raw }: { raw: string }) {
  const [copied, setCopied] = useState(false);
  const display = formatAccountForDisplay(raw);
  async function copy() {
    try {
      const compact = raw.replace(/\s/g, '');
      await navigator.clipboard.writeText(compact);
      setCopied(true);
      toast.success('Copié dans le presse-papiers');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copie impossible');
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="break-all font-mono text-base font-semibold text-ink md:text-lg">
        {display}
      </span>
      <button
        type="button"
        onClick={() => void copy()}
        className="rounded-input border border-line p-2 text-primary hover:bg-surface-hover"
        aria-label="Copier le numéro ou l’IBAN"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

function operatorShortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 1) + '.';
  return `${parts[0]!.charAt(0)}. ${parts[parts.length - 1]}`;
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { data: session } = useSession();
  const { data: me } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
  });
  const notifyPhone = userWhatsappNotifyPhone(me);
  const { data: tx, isLoading } = useTransaction(id);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const sessionId = session?.user?.id;
  const isClient =
    tx && sessionId != null && sameUserId(sessionId, tx.client.id);

  async function submitDispute() {
    try {
      await transactionsApi.dispute(id, {
        reason: disputeReason || 'Problème signalé',
      });
      toast.success('Litige ouvert');
      setDisputeOpen(false);
      router.refresh();
    } catch {
      toast.error('Impossible d’ouvrir le litige');
    }
  }

  async function submitReview() {
    try {
      await reviewsApi.create(id, { rating, comment: reviewComment || undefined });
      toast.success('Merci pour votre avis');
      setReviewOpen(false);
    } catch {
      toast.error('Envoi de l’avis impossible');
    }
  }

  const showDispute =
    tx && tx.status !== 'COMPLETED' && tx.status !== 'CANCELLED';

  if (isLoading || !tx) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-ink-muted">Accès réservé au client de la transaction.</p>
        <Link href="/transactions" className="text-primary hover:underline">
          Retour
        </Link>
      </div>
    );
  }

  const swaptrustDestination = resolveClientSendDestination(tx);
  const rateRef =
    tx.googleRate != null && tx.googleRate > 0 ? tx.googleRate : tx.rate;

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-8 lg:max-w-xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-xl font-bold">Transaction #{tx.id}</h1>
          <p className="text-sm text-ink-muted">
            Opérateur : {operatorShortName(tx.operator.name)} · ⭐{' '}
            {tx.operator.ratingAvg?.toFixed(1) ?? '—'}
          </p>
        </div>
        <Link
          href={`/transactions/${id}/chat`}
          className="inline-flex items-center gap-2 rounded-pill border border-line px-3 py-1.5 text-sm text-primary hover:bg-surface-hover"
        >
          <MessageCircle className="h-4 w-4" />
          Chat
        </Link>
      </div>

      <Card className="space-y-2 text-sm">
        {tx.grossAmount != null && tx.netAmount != null ? (
          <>
            <div className="flex justify-between">
              <span className="text-ink-muted">Montant échangé (net)</span>
              <span className="font-semibold text-ink">
                {formatMinorForSendRail(tx, tx.netAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Commission SwapTrust</span>
              <span className="font-semibold text-accent">
                {formatMinorForSendRail(tx, tx.commissionAmount)}
              </span>
            </div>
            <div className="flex justify-between border-t border-line pt-2">
              <span className="font-medium text-ink">Total à vous envoyer</span>
              <span className="font-bold text-ink">
                {formatMinorForSendRail(tx, tx.grossAmount)}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between">
              <span className="text-ink-muted">Montant CFA</span>
              <span className="font-semibold text-ink">{formatCFA(tx.amountCfa)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Montant RUB</span>
              <span className="font-semibold text-ink">{formatRUB(tx.amountRub)}</span>
            </div>
            {tx.commissionAmount > 0 ? (
              <div className="flex justify-between text-xs">
                <span className="text-ink-muted">Commission (réf.)</span>
                <span>{formatMinorForSendRail(tx, tx.commissionAmount)}</span>
              </div>
            ) : null}
          </>
        )}
        <div className="flex justify-between text-xs">
          <span className="text-ink-muted">Taux Google (réf.)</span>
          <span>1 000 CFA ≈ {rubDisplayFor1000Cfa(rateRef)} ₽</span>
        </div>
      </Card>

      <TransactionTimeline status={tx.status} />

      {tx.status === 'INITIATED' && swaptrustDestination ? (
        <Card className="space-y-3 p-5">
          <p className="text-sm font-medium text-ink">
            Envoyez <span className="text-accent">exactement</span> sur ce compte SwapTrust
          </p>
          <div className="rounded-input border-2 border-primary/30 bg-gradient-to-br from-primary/[0.06] to-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Réception officielle
            </p>
            <p className="mt-1 font-medium text-ink">{swaptrustDestination.accountName}</p>
            <div className="mt-3">
              <CopyableAccountValue raw={swaptrustDestination.accountNumber} />
            </div>
            <p className="mt-4 rounded-input bg-muted/50 px-3 py-2 text-center font-display text-lg font-bold text-ink">
              Montant exact : {formatGrossSendForClient(tx)}
            </p>
          </div>
          <div className="flex gap-2 rounded-input border border-warning/35 bg-warning/10 p-3 text-xs text-ink-secondary">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
            <p>
              N’envoyez <strong className="text-ink">pas</strong> directement à l’opérateur : les fonds
              passent toujours par SwapTrust, qui reverse le net à l’opérateur après commission.
            </p>
          </div>
        </Card>
      ) : null}

      {tx.status === 'INITIATED' && !swaptrustDestination ? (
        <Card className="space-y-2 border-warning/30 bg-warning/10 p-4 text-sm text-ink-secondary">
          <div className="flex gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0 text-warning" aria-hidden />
            <div>
              <p className="font-medium text-ink">Numéro SwapTrust indisponible</p>
              <p className="mt-1 text-xs">
                Le compte de réception officiel n’est pas encore renvoyé par l’API ou configuré
                (variables <code className="rounded bg-muted px-1">NEXT_PUBLIC_SWAPTRUST_*</code>).
                Contactez le support en indiquant la transaction #{tx.id}.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {tx.status === 'INITIATED' ? (
        <ClientSendButton
          transactionId={id}
          onWhatsappNotify={() => {
            if (notifyPhone) showWhatsappToast(notifyPhone);
          }}
        />
      ) : null}

      {tx.status === 'CLIENT_SENT' || tx.status === 'OPERATOR_VERIFIED' ? (
        <p className="text-center text-sm text-ink-muted">
          L’opérateur vérifie votre reçu…
        </p>
      ) : null}

      {tx.operatorProofUrl &&
      (tx.status === 'OPERATOR_SENT' || tx.status === 'COMPLETED') ? (
        <div>
          <p className="mb-2 text-sm font-medium text-ink">Reçu de l’opérateur</p>
          <ProofViewer url={tx.operatorProofUrl} label="Reçu opérateur" />
        </div>
      ) : null}

      {tx.status === 'OPERATOR_SENT' ? (
        <ClientConfirmButton
          transactionId={id}
          onWhatsappNotify={() => {
            if (notifyPhone) showWhatsappToast(notifyPhone);
          }}
        />
      ) : null}

      {tx.status === 'COMPLETED' ? (
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={() => setReviewOpen(true)}
        >
          <Star className="h-4 w-4" />
          Laisser un avis
        </Button>
      ) : null}

      {showDispute ? (
        <Button
          type="button"
          variant="ghost"
          className="w-full text-danger"
          onClick={() => setDisputeOpen(true)}
        >
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          Signaler un problème
        </Button>
      ) : null}

      <BottomSheet open={disputeOpen} onClose={() => setDisputeOpen(false)} title="Litige">
        <textarea
          className="input-field mb-3 min-h-[100px]"
          placeholder="Décrivez le problème"
          value={disputeReason}
          onChange={(e) => setDisputeReason(e.target.value)}
        />
        <Button type="button" className="w-full" onClick={() => void submitDispute()}>
          Envoyer
        </Button>
      </BottomSheet>

      <BottomSheet open={reviewOpen} onClose={() => setReviewOpen(false)} title="Votre avis">
        <div className="space-y-3">
          <Input
            label="Note (1–5)"
            type="number"
            min={1}
            max={5}
            value={String(rating)}
            onChange={(e) => setRating(Number(e.target.value) || 5)}
          />
          <textarea
            className="input-field min-h-[80px]"
            placeholder="Commentaire (optionnel)"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
          />
          <Button type="button" className="w-full" onClick={() => void submitReview()}>
            Publier
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
