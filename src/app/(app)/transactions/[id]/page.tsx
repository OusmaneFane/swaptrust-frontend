'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  MessageCircle,
  Receipt,
  Star,
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
import { Badge } from '@/components/ui/Badge';
import { useTransaction } from '@/hooks/useTransaction';
import { resolveClientSendDestination } from '@/lib/resolve-client-send-destination';
import { rubDisplayFor1000Cfa } from '@/lib/rate-xof-rub';
import { formatAccountForDisplay } from '@/lib/donisend-receive';
import {
  formatGrossSendForClient,
  formatMinorForSendRail,
} from '@/lib/transaction-display';
import { cn, formatCFA, formatRUB } from '@/lib/utils';
import { sameUserId } from '@/lib/same-user';
import { authApi, transactionsApi, reviewsApi } from '@/services/api';
import { toast } from 'sonner';
import { showWhatsappToast } from '@/components/ui/WhatsappToast';
import { userWhatsappNotifyPhone } from '@/lib/user-phones';
import type { TransactionStatus } from '@/types';
import { TRANSACTION_STEPS } from '@/types/transaction';

function statusBadgeTone(
  s: TransactionStatus,
): 'default' | 'success' | 'warning' | 'danger' | 'muted' {
  switch (s) {
    case 'COMPLETED':
      return 'success';
    case 'CANCELLED':
    case 'DISPUTED':
      return 'danger';
    case 'CLIENT_SENT':
    case 'INITIATED':
      return 'warning';
    default:
      return 'default';
  }
}

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
      <span className="break-all font-mono text-sm font-semibold text-text-dark sm:text-base">
        {display}
      </span>
      <button
        type="button"
        onClick={() => void copy()}
        className={cn(
          'rounded-xl border border-slate-200/90 bg-white p-2 text-primary shadow-sm ring-1 ring-slate-900/[0.04] transition',
          'hover:border-primary/25 hover:bg-primary/[0.04]',
        )}
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

const shell = 'relative mx-auto min-w-0 max-w-lg pb-10 pt-0 xl:max-w-2xl';
const halo =
  'pointer-events-none absolute inset-x-0 top-0 mx-auto h-[min(14rem,32vh)] max-w-xl rounded-[40%] bg-gradient-to-b from-primary/[0.14] via-violet-500/[0.05] to-transparent blur-3xl';

const surfaceCard =
  'rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm ring-1 ring-slate-900/[0.04] backdrop-blur-sm';

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
      await reviewsApi.create(id, {
        rating,
        comment: reviewComment || undefined,
      });
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
      <div className={shell}>
        <div className={halo} aria-hidden />
        <div className="relative space-y-3">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className={shell}>
        <div className={halo} aria-hidden />
        <div
          className={cn(
            surfaceCard,
            'relative space-y-4 p-8 text-center',
          )}
        >
          <p className="text-sm font-medium text-text-dark">
            Accès réservé au client de la transaction.
          </p>
          <Link
            href="/transactions"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/[0.1]"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l’historique
          </Link>
        </div>
      </div>
    );
  }

  const donisendDestination = resolveClientSendDestination(tx);
  const rateRef =
    tx.googleRate != null && tx.googleRate > 0 ? tx.googleRate : tx.rate;

  return (
    <div className={shell}>
      <div className={halo} aria-hidden />
      <div className="relative space-y-4">
        <Link
          href="/transactions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          Historique
        </Link>

        <div
          className={cn(
            surfaceCard,
            'flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between',
          )}
        >
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold tracking-tight text-text-dark sm:text-2xl">
                Transaction #{tx.id}
              </h1>
              <Badge tone={statusBadgeTone(tx.status)} className="text-[10px]">
                {TRANSACTION_STEPS[tx.status].label}
              </Badge>
            </div>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted sm:text-sm">
              <span>
                Opérateur :{' '}
                <span className="font-medium text-text-dark">
                  {operatorShortName(tx.operator.name)}
                </span>
              </span>
              <span className="hidden text-slate-300 sm:inline" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-amber-800/90">
                <Star
                  className="h-3.5 w-3.5 fill-amber-400 text-amber-500"
                  strokeWidth={1.5}
                  aria-hidden
                />
                {tx.operator.ratingAvg != null
                  ? tx.operator.ratingAvg.toFixed(1)
                  : '—'}
              </span>
            </p>
          </div>
          <Link
            href={`/transactions/${id}/chat`}
            className={cn(
              'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/15 bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow-sm ring-1 ring-slate-900/[0.04] transition',
              'hover:border-primary/30 hover:bg-primary/[0.04]',
            )}
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
            Chat
          </Link>
        </div>

        <Card
          className={cn(
            surfaceCard,
            'space-y-2.5 p-4 text-sm shadow-none',
          )}
        >
          {tx.grossAmount != null && tx.netAmount != null ? (
            <>
              <div className="flex justify-between gap-3">
                <span className="text-text-muted">Montant échangé (net)</span>
                <span className="text-right font-semibold tabular-nums text-text-dark">
                  {formatMinorForSendRail(tx, tx.netAmount)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-text-muted">Commission DoniSend</span>
                <span className="text-right font-semibold tabular-nums text-accent">
                  {formatMinorForSendRail(tx, tx.commissionAmount)}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t border-slate-100 pt-2.5">
                <span className="font-medium text-text-dark">
                  Total à vous envoyer
                </span>
                <span className="text-right font-bold tabular-nums text-text-dark">
                  {formatMinorForSendRail(tx, tx.grossAmount)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between gap-3">
                <span className="text-text-muted">Montant CFA</span>
                <span className="font-semibold tabular-nums text-text-dark">
                  {formatCFA(tx.amountCfa)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-text-muted">Montant RUB</span>
                <span className="font-semibold tabular-nums text-text-dark">
                  {formatRUB(tx.amountRub)}
                </span>
              </div>
              {tx.commissionAmount > 0 ? (
                <div className="flex justify-between gap-3 text-xs">
                  <span className="text-text-muted">Commission (réf.)</span>
                  <span className="tabular-nums">
                    {formatMinorForSendRail(tx, tx.commissionAmount)}
                  </span>
                </div>
              ) : null}
            </>
          )}
          <div className="flex justify-between gap-3 border-t border-slate-100 pt-2.5 text-xs">
            <span className="text-text-muted">Taux Google (réf.)</span>
            <span className="font-medium tabular-nums text-text-dark">
              1 000 CFA ≈ {rubDisplayFor1000Cfa(rateRef)} ₽
            </span>
          </div>
        </Card>

        <div className={cn(surfaceCard, 'p-4')}>
          <TransactionTimeline status={tx.status} />
        </div>

        {tx.status === 'INITIATED' && donisendDestination ? (
          <Card
            className={cn(
              surfaceCard,
              'space-y-3 border-primary/15 bg-gradient-to-br from-white via-primary/[0.03] to-white p-4 shadow-none sm:p-5',
            )}
          >
            <p className="text-sm font-semibold text-text-dark">
              Envoyez <span className="text-accent">exactement</span> sur ce
              compte DoniSend
            </p>
            <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/[0.06] to-white p-4 shadow-sm ring-1 ring-primary/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Réception officielle
              </p>
              <p className="mt-1 text-sm font-semibold text-text-dark">
                {donisendDestination.accountName}
              </p>
              <div className="mt-3">
                <CopyableAccountValue raw={donisendDestination.accountNumber} />
              </div>
              <p className="mt-4 rounded-xl bg-slate-900/[0.04] px-3 py-2.5 text-center font-display text-base font-bold tabular-nums text-text-dark sm:text-lg">
                Montant exact : {formatGrossSendForClient(tx)}
              </p>
            </div>
            <div className="flex gap-2.5 rounded-xl border border-amber-200/60 bg-amber-50/80 p-3 text-xs leading-relaxed text-amber-950/90">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                aria-hidden
              />
              <p>
                N’envoyez <strong className="text-text-dark">pas</strong>{' '}
                directement à l’opérateur : les fonds passent toujours par
                DoniSend, qui reverse le net à l’opérateur après commission.
              </p>
            </div>
          </Card>
        ) : null}

        {tx.status === 'INITIATED' && !donisendDestination ? (
          <div
            className={cn(
              surfaceCard,
              'flex gap-3 border-amber-200/70 bg-amber-50/50 p-4 text-sm text-amber-950/90',
            )}
          >
            <AlertTriangle
              className="h-5 w-5 shrink-0 text-amber-600"
              aria-hidden
            />
            <div>
              <p className="font-semibold text-text-dark">
                Numéro DoniSend indisponible
              </p>
              <p className="mt-1 text-xs leading-relaxed">
                Le compte de réception officiel n’est pas encore renvoyé par
                l’API ou configuré (variables{' '}
                <code className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-text-dark">
                  NEXT_PUBLIC_*
                </code>{' '}
                de réception). Contactez le support en indiquant la transaction
                #{tx.id}.
              </p>
            </div>
          </div>
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
          <p
            className={cn(
              surfaceCard,
              'py-3 text-center text-sm font-medium text-text-muted',
            )}
          >
            L’opérateur vérifie votre reçu…
          </p>
        ) : null}

        {tx.operatorProofUrl &&
        (tx.status === 'OPERATOR_SENT' || tx.status === 'COMPLETED') ? (
          <div className={cn(surfaceCard, 'p-4')}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Receipt className="h-4 w-4" strokeWidth={2} />
              </div>
              <p className="text-sm font-bold text-text-dark">
                Reçu de l’opérateur
              </p>
            </div>
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

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          {tx.status === 'COMPLETED' ? (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 rounded-xl border-slate-200 shadow-sm sm:flex-1"
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
              className="w-full rounded-xl text-danger hover:bg-danger/[0.06] sm:flex-1"
              onClick={() => setDisputeOpen(true)}
            >
              <AlertTriangle className="mr-2 inline h-4 w-4" />
              Signaler un problème
            </Button>
          ) : null}
        </div>

        <BottomSheet
          open={disputeOpen}
          onClose={() => setDisputeOpen(false)}
          title="Litige"
        >
          <textarea
            className="input-field-surface mb-3 min-h-[100px] rounded-xl"
            placeholder="Décrivez le problème"
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
          />
          <Button
            type="button"
            className="w-full rounded-xl"
            onClick={() => void submitDispute()}
          >
            Envoyer
          </Button>
        </BottomSheet>

        <BottomSheet
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          title="Votre avis"
        >
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
              className="input-field-surface min-h-[80px] rounded-xl"
              placeholder="Commentaire (optionnel)"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
            <Button
              type="button"
              className="w-full rounded-xl"
              onClick={() => void submitReview()}
            >
              Publier
            </Button>
          </div>
        </BottomSheet>
      </div>
    </div>
  );
}
