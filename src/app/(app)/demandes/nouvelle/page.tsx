'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { requestsApi, ratesApi } from '@/services/api';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { cn, formatCFA, formatRUB } from '@/lib/utils';
import { PAYMENT_METHOD_LABELS } from '@/constants/payment-methods';
import type { RequestType } from '@/types';

const schema = z.object({
  type: z.enum(['NEED_RUB', 'NEED_CFA']),
  amountWantedMajor: z
    .string()
    .min(1, 'Montant requis')
    .refine((s) => Number(s) > 0, 'Montant trop faible'),
  paymentMethod: z.enum([
    'ORANGE_MONEY',
    'WAVE',
    'BANK_TRANSFER',
    'SBP',
    'OTHER',
  ]),
  phoneToSend: z.string().min(8, 'Numéro requis'),
  note: z.string().max(300).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NouvelleDemandePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const { data: rateData } = useExchangeRate();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'NEED_RUB',
      paymentMethod: 'ORANGE_MONEY',
    },
  });

  const watchedType = form.watch('type');
  const watchedAmount = Number(form.watch('amountWantedMajor') || 0);

  const { data: calc } = useQuery({
    queryKey: ['rates', 'calc', 'request', watchedAmount, watchedType],
    queryFn: () =>
      watchedType === 'NEED_RUB'
        ? ratesApi.calculate(watchedAmount, 'RUB', 'XOF')
        : ratesApi.calculate(watchedAmount, 'XOF', 'RUB'),
    enabled: watchedAmount > 0,
  });

  const mutation = useMutation({
    mutationFn: requestsApi.create,
    onSuccess: () => {
      toast.success('Demande publiée ! Un opérateur va vous contacter.');
      router.push('/tableau-de-bord');
    },
    onError: () => toast.error('Publication impossible'),
  });

  const rateLine =
    rateData?.rate && rateData.inverseRate
      ? `1 000 F CFA = ${((1000 * rateData.rate) / 100).toFixed(2)} ₽`
      : null;

  function onPublish() {
    const v = form.getValues();
    const major = Number(v.amountWantedMajor);
    if (!Number.isFinite(major) || major <= 0) {
      toast.error('Montant invalide');
      return;
    }
    const amountWanted = Math.round(major * 100);
    mutation.mutate({
      type: v.type as RequestType,
      amountWanted,
      paymentMethod: v.paymentMethod,
      phoneToSend: v.phoneToSend.trim(),
      ...(v.note?.trim() ? { note: v.note.trim() } : {}),
    });
  }

  const sendMinor =
    calc && watchedAmount > 0 ? Math.round(calc.result * 100) : 0;
  const commissionDisplay =
    calc?.commissionAmount != null
      ? watchedType === 'NEED_RUB'
        ? formatCFA(calc.commissionAmount)
        : formatRUB(calc.commissionAmount)
      : sendMinor > 0
        ? watchedType === 'NEED_RUB'
          ? formatCFA(Math.round(sendMinor * 0.02))
          : formatRUB(Math.round(sendMinor * 0.02))
        : '—';

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">Nouvelle demande</h1>

      {step === 1 ? (
        <Card className="space-y-5 p-5">
          <p className="text-sm font-medium text-ink-secondary">Étape 1 — Ce dont j’ai besoin</p>
          <p className="text-sm text-ink-muted">J’ai besoin de :</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                { id: 'NEED_RUB' as const, title: 'Roubles (₽)', sub: 'Je paie en CFA' },
                { id: 'NEED_CFA' as const, title: 'Francs CFA', sub: 'Je paie en ₽' },
              ] as const
            ).map(({ id, title, sub }) => (
              <button
                key={id}
                type="button"
                onClick={() => form.setValue('type', id)}
                className={cn(
                  'rounded-card border p-4 text-left transition-colors',
                  watchedType === id
                    ? 'border-primary bg-primary/10'
                    : 'border-line hover:border-line',
                )}
              >
                <p className="font-semibold text-ink">{title}</p>
                <p className="text-xs text-ink-muted">{sub}</p>
              </button>
            ))}
          </div>
          <Input
            label={
              watchedType === 'NEED_RUB'
                ? 'Montant souhaité (₽, unités)'
                : 'Montant souhaité (CFA, unités)'
            }
            type="number"
            step="0.01"
            error={form.formState.errors.amountWantedMajor?.message}
            {...form.register('amountWantedMajor')}
          />
          <div className="rounded-input border border-line bg-surface/80 p-3 text-sm text-ink-secondary">
            <p className="font-medium text-ink">Je vais envoyer (estimation)</p>
            {calc && watchedAmount > 0 ? (
              <>
                <p className="mt-1 text-lg font-semibold text-accent">
                  {watchedType === 'NEED_RUB'
                    ? formatCFA(Math.round(calc.result * 100))
                    : formatRUB(Math.round(calc.result * 100))}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  Taux indicatif : 1 000 CFA ={' '}
                  {rateData?.rate != null
                    ? ((1000 * rateData.rate) / 100).toFixed(2)
                    : calc.rate.toFixed(4)}{' '}
                  ₽ (verrouillé à la publication)
                </p>
              </>
            ) : (
              <p className="mt-1 text-xs text-ink-muted">Saisissez un montant.</p>
            )}
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={async () => {
              const ok = await form.trigger('amountWantedMajor');
              if (ok && watchedAmount > 0) setStep(2);
            }}
          >
            Continuer
          </Button>
        </Card>
      ) : null}

      {step === 2 ? (
        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <p className="text-sm font-medium text-ink-secondary">
              Étape 2 — Comment j’envoie
            </p>
            <div>
              <label className="mb-2 block text-sm text-ink-secondary">
                Méthode d’envoi
              </label>
              <select className="input-field" {...form.register('paymentMethod')}>
                {(Object.keys(PAYMENT_METHOD_LABELS) as Array<keyof typeof PAYMENT_METHOD_LABELS>).map(
                  (k) => (
                    <option key={k} value={k}>
                      {PAYMENT_METHOD_LABELS[k]}
                    </option>
                  ),
                )}
              </select>
            </div>
            <Input
              label="Mon numéro pour recevoir les fonds"
              placeholder="+223 XX XX XX XX"
              error={form.formState.errors.phoneToSend?.message}
              {...form.register('phoneToSend')}
            />
            <Input
              label="Message optionnel pour l’opérateur"
              {...form.register('note')}
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Retour
              </Button>
            </div>
          </Card>

          <Card className="space-y-3 border-primary/20 bg-gradient-to-br from-card to-primary/[0.04] p-5 text-sm">
            <p className="font-display font-semibold text-ink">Récapitulatif</p>
            <div className="flex justify-between">
              <span className="text-ink-muted">Vous recevrez</span>
              <span className="font-medium text-ink">
                {watchedType === 'NEED_RUB'
                  ? formatRUB(Math.round(watchedAmount * 100))
                  : formatCFA(Math.round(watchedAmount * 100))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Vous enverrez</span>
              <span className="font-medium text-accent">
                {calc && watchedAmount > 0
                  ? watchedType === 'NEED_RUB'
                    ? formatCFA(Math.round(calc.result * 100))
                    : formatRUB(Math.round(calc.result * 100))
                  : '—'}
              </span>
            </div>
            {rateLine ? (
              <div className="flex justify-between">
                <span className="text-ink-muted">Taux (indicatif)</span>
                <span className="text-ink">{rateLine}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-ink-muted">Commission (estim.)</span>
              <span className="text-ink">{commissionDisplay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Via</span>
              <span className="text-ink">
                {PAYMENT_METHOD_LABELS[form.watch('paymentMethod')]}
              </span>
            </div>
            <p className="rounded-input border border-warning/30 bg-warning/10 p-3 text-xs text-ink-secondary">
              Le taux est verrouillé au moment de la publication. Un opérateur prendra en
              charge votre demande sous peu.
            </p>
            <Button
              type="button"
              className="w-full"
              loading={mutation.isPending}
              onClick={() => onPublish()}
            >
              Publier ma demande
            </Button>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
