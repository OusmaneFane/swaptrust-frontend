'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MessageCircle, AlertTriangle, Star } from 'lucide-react';
import { TransactionTimeline } from '@/components/exchange/TransactionTimeline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import {
  useTransaction,
  useConfirmSend,
  useConfirmReceive,
} from '@/hooks/useTransaction';
import { formatCFA, formatRUB } from '@/lib/utils';
import { sameUserId } from '@/lib/same-user';
import { disputesApi, reviewsApi } from '@/services/api';
import { toast } from 'sonner';

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { data: session } = useSession();
  const { data: tx, isLoading } = useTransaction(id);
  const confirmSend = useConfirmSend(id);
  const confirmReceive = useConfirmReceive(id);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const sessionId = session?.user?.id;
  const isSender =
    tx && sessionId != null && sameUserId(sessionId, tx.sender.id);
  const isReceiver =
    tx && sessionId != null && sameUserId(sessionId, tx.receiver.id);

  function onProofFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    confirmSend.mutate(file);
  }

  async function submitDispute() {
    try {
      await disputesApi.open(id, { reason: disputeReason || 'Problème signalé' });
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
    tx &&
    tx.status !== 'COMPLETED' &&
    tx.status !== 'CANCELLED';

  if (isLoading || !tx) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-8 lg:max-w-xl">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-xl font-bold">Transaction #{tx.id}</h1>
        <Link
          href={`/transactions/${id}/chat`}
          className="inline-flex items-center gap-2 rounded-pill border border-line px-3 py-1.5 text-sm text-primary hover:bg-surface-hover"
        >
          <MessageCircle className="h-4 w-4" />
          Chat
        </Link>
      </div>

      <Card className="space-y-2 text-sm">
        <p>
          <span className="text-ink-muted">CFA :</span>{' '}
          <span className="font-semibold">{formatCFA(tx.amountCfa)}</span>
        </p>
        <p>
          <span className="text-ink-muted">RUB :</span>{' '}
          <span className="font-semibold">{formatRUB(tx.amountRub)}</span>
        </p>
        <p className="text-ink-faint">
          Votre rôle : {isSender ? 'Émetteur' : 'Récepteur'}
        </p>
      </Card>

      <TransactionTimeline status={tx.status} />

      <div className="flex flex-col gap-3">
        {tx.status === 'INITIATED' && isSender && (
          <label className="btn-primary cursor-pointer py-2 text-center text-sm">
            J’ai envoyé les fonds (preuve)
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={onProofFile}
              disabled={confirmSend.isPending}
            />
          </label>
        )}

        {tx.status === 'SENDER_SENT' && isReceiver && (
          <Button
            type="button"
            className="w-full"
            loading={confirmReceive.isPending}
            onClick={() => confirmReceive.mutate()}
          >
            J’ai bien reçu les CFA
          </Button>
        )}

        {tx.status === 'RECEIVER_CONFIRMED' && isReceiver && (
          <label className="btn-primary cursor-pointer py-2 text-center text-sm">
            J’ai envoyé les roubles (preuve)
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={onProofFile}
              disabled={confirmSend.isPending}
            />
          </label>
        )}

        {tx.status === 'RUB_SENT' && isSender && (
          <Button
            type="button"
            className="w-full"
            loading={confirmReceive.isPending}
            onClick={() => confirmReceive.mutate()}
          >
            J’ai bien reçu les roubles
          </Button>
        )}

        {tx.status === 'COMPLETED' && (
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={() => setReviewOpen(true)}
          >
            <Star className="h-4 w-4" />
            Laisser un avis
          </Button>
        )}
      </div>

      {showDispute && (
        <Button
          type="button"
          variant="ghost"
          className="w-full text-danger"
          onClick={() => setDisputeOpen(true)}
        >
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          Signaler un problème
        </Button>
      )}

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
