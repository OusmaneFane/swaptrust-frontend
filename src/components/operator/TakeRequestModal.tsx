'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ExchangeRequest } from '@/types';
import { operatorApi } from '@/services/api';
import { formatCFA, formatRUB } from '@/lib/utils';
import { PAYMENT_METHOD_LABELS } from '@/constants/payment-methods';

export type TakeRequestModalProps = {
  request: ExchangeRequest;
  onClose: () => void;
};

export function TakeRequestModal({ request, onClose }: TakeRequestModalProps) {
  const [paymentNumber, setPaymentNumber] = useState('');
  const [note, setNote] = useState('');
  const qc = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: () =>
      operatorApi.takeRequest(request.id, {
        operatorPaymentNumber: paymentNumber.trim(),
        operatorNote: note.trim() || undefined,
      }),
    onSuccess: (transaction) => {
      toast.success('Demande prise en charge !');
      void qc.invalidateQueries({ queryKey: ['operator'] });
      void qc.invalidateQueries({ queryKey: ['requests'] });
      router.push(`/operateur/transactions/${transaction.id}`);
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
      <div>
        <label className="mb-1 block text-sm text-ink-muted">
          Votre numéro sur lequel le client doit envoyer *
        </label>
        <input
          type="tel"
          placeholder="+223 70 XX XX XX"
          value={paymentNumber}
          onChange={(e) => setPaymentNumber(e.target.value)}
          className="input-field"
        />
      </div>
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
        disabled={!paymentNumber.trim() || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? 'Prise en charge…' : 'Prendre en charge'}
      </button>
    </div>
  );
}
