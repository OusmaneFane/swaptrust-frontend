'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ExchangeRequest, Transaction } from '@/types';
import { adminApi, operatorApi } from '@/services/api';
import {
  formatAccountForDisplay,
  getSwaptrustReceiveFallback,
} from '@/lib/swaptrust-receive';
import { formatCFA, formatRUB } from '@/lib/utils';
import { PAYMENT_METHOD_LABELS } from '@/constants/payment-methods';

export type TakeRequestModalProps = {
  request: ExchangeRequest;
  onClose: () => void;
  /** Navigation après succès (défaut : `/operateur/transactions/:id`). */
  afterTakeHref?: (tx: Transaction) => string;
};

export function TakeRequestModal({
  request,
  onClose,
  afterTakeHref,
}: TakeRequestModalProps) {
  const [paymentNumber, setPaymentNumber] = useState('');
  const [note, setNote] = useState('');
  const qc = useQueryClient();
  const router = useRouter();

  const { data: platformAccounts, isSuccess: platformListOk } = useQuery({
    queryKey: ['admin', 'platform-accounts'],
    queryFn: () => adminApi.platformAccounts(),
    staleTime: 60_000,
    retry: false,
  });

  const envReceive = getSwaptrustReceiveFallback(request.paymentMethod);
  const dbMatch = platformListOk
    ? platformAccounts?.find(
        (a) => a.method === request.paymentMethod && a.isActive,
      )
    : undefined;
  /** Compte SwapTrust connu pour cette méthode → pas de saisie « numéro client ». */
  const swaptrustReceive = dbMatch ?? envReceive;
  const platformReceiveConfigured = swaptrustReceive != null;
  const receiveLabel = swaptrustReceive?.accountName ?? 'SwapTrust';

  const mutation = useMutation({
    mutationFn: () =>
      operatorApi.takeRequest(request.id, {
        operatorPaymentNumber: platformReceiveConfigured
          ? ''
          : paymentNumber.trim(),
        operatorNote: note.trim() || undefined,
      }),
    onSuccess: (transaction) => {
      toast.success('Demande prise en charge !');
      void qc.invalidateQueries({ queryKey: ['operator'] });
      void qc.invalidateQueries({ queryKey: ['requests'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'demandes'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'requests'] });
      const tx = transaction as Transaction;
      router.push(afterTakeHref?.(tx) ?? `/operateur/transactions/${tx.id}`);
      onClose();
    },
    onError: () => toast.error('Prise en charge impossible'),
  });

  return (
    <div className="space-y-4">
      <div className="glass-card space-y-2 p-4">
        <p className="font-semibold text-ink">{request.client.name}</p>
        <div className="flex justify-between text-sm">
          <span className="text-ink-muted">Recevra</span>
          <span className="font-medium text-ink">
            {request.type === 'NEED_RUB'
              ? formatRUB(request.amountWanted)
              : formatCFA(request.amountWanted)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-muted">Enverra</span>
          <span className="font-medium text-accent">
            {request.type === 'NEED_RUB'
              ? formatCFA(request.amountToSend)
              : formatRUB(request.amountToSend)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-muted">Via</span>
          <span className="text-ink">
            {PAYMENT_METHOD_LABELS[request.paymentMethod] ??
              request.paymentMethod}
          </span>
        </div>
        {request.note ? (
          <p className="text-xs italic text-ink-faint">« {request.note} »</p>
        ) : null}
      </div>

      {platformReceiveConfigured ? (
        <div className="rounded-input border border-success/30 bg-success/10 p-3 text-sm text-ink-secondary">
          <p className="font-medium text-ink">Paiement client via SwapTrust</p>
          <p className="mt-1 text-xs leading-relaxed">
            Un compte de réception est déjà configuré pour{' '}
            <strong className="text-ink">
              {PAYMENT_METHOD_LABELS[request.paymentMethod]}
            </strong>{' '}
            ({receiveLabel}
            {swaptrustReceive ? (
              <>
                {' '}
                ·{' '}
                <span className="font-mono text-ink">
                  {formatAccountForDisplay(swaptrustReceive.accountNumber)}
                </span>
              </>
            ) : null}
            ). Le client recevra les instructions vers ce numéro / IBAN — vous n’avez pas à
            indiquer ici un numéro « pour le client ».
          </p>
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-sm text-ink-muted">
            Numéro sur lequel SwapTrust vous versera le net (après commission) *
          </label>
          <p className="mb-2 text-[11px] leading-snug text-ink-faint">
            Ce n’est pas le numéro affiché au client pour payer : sans compte SwapTrust configuré
            pour cette méthode, l’API peut encore exiger votre coordonnée de réception
            opérateur.
          </p>
          <input
            type="tel"
            placeholder="+223 70 XX XX XX"
            value={paymentNumber}
            onChange={(e) => setPaymentNumber(e.target.value)}
            className="input-field"
          />
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm text-ink-muted">
          Note interne (facultatif)
        </label>
        <input
          type="text"
          placeholder="Ex. client régulier…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="input-field"
        />
      </div>
      <button
        type="button"
        className="btn-primary w-full"
        disabled={
          mutation.isPending ||
          (!platformReceiveConfigured && !paymentNumber.trim())
        }
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? 'Prise en charge…' : 'Prendre en charge'}
      </button>
    </div>
  );
}
