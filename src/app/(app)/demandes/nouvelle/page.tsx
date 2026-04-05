'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { showWhatsappToast } from '@/components/ui/WhatsappToast';
import { getApiErrorMessage } from '@/lib/api-error-message';
import {
  isNetXofOutsideTypicalRange,
  majorToMinor,
  MIN_REQUEST_AMOUNT_MINOR,
} from '@/lib/money-minor';
import { flexiblePhoneToApi } from '@/lib/phone-api-format';
import { parseDecimalLike } from '@/lib/parse-decimal-json';
import { userWhatsappNotifyPhone } from '@/lib/user-phones';
import { authApi, requestsApi, ratesApi } from '@/services/api';
import { CommissionBreakdown } from '@/components/client/CommissionBreakdown';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { getPublicCommissionPercent } from '@/lib/commission-config';
import { cn, formatCFA, formatRUB } from '@/lib/utils';
import { PAYMENT_METHOD_LABELS } from '@/constants/payment-methods';
import type { RequestType, User } from '@/types';

const schema = z.object({
  type: z.enum(['NEED_RUB', 'NEED_CFA']),
  amountWantedMajor: z
    .string()
    .min(1, 'Montant requis')
    .refine((s) => Number(s) > 0, 'Montant trop faible')
    .refine(
      (s) => majorToMinor(Number(s)) >= MIN_REQUEST_AMOUNT_MINOR,
      'Minimum 1,00 affiché (100 centimes ou 100 kopecks côté API)',
    ),
  paymentMethod: z.enum([
    'ORANGE_MONEY',
    'WAVE',
    'BANK_TRANSFER',
    'SBP',
    'OTHER',
  ]),
  phoneToSend: z
    .string()
    .min(8, 'Numéro requis')
    .refine(
      (s) => flexiblePhoneToApi(s) !== null,
      'Indicatif sans + : ex. 223… (Mali) ou 7… (Russie)',
    ),
  note: z.string().max(300).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NouvelleDemandePage() {
  const router = useRouter();
  const qc = useQueryClient();
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
  /** Centimes / kopecks — même unité que Swagger (`amount` sur /rates/calculate et amountWanted). */
  const amountMinor =
    watchedAmount > 0 && Number.isFinite(watchedAmount)
      ? majorToMinor(watchedAmount)
      : 0;

  const { data: calc } = useQuery({
    queryKey: ['rates', 'calc', 'request', amountMinor, watchedType],
    queryFn: () =>
      watchedType === 'NEED_RUB'
        ? ratesApi.calculate(amountMinor, 'RUB', 'XOF')
        : ratesApi.calculate(amountMinor, 'XOF', 'RUB'),
    enabled: amountMinor >= MIN_REQUEST_AMOUNT_MINOR,
  });

  const { data: me } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
  });

  const mutation = useMutation({
    mutationFn: requestsApi.create,
    onSuccess: () => {
      toast.success('Demande publiée ! Un opérateur va vous contacter.');
      const fresh =
        qc.getQueryData<User>(['auth', 'me']) ?? me;
      const phone = userWhatsappNotifyPhone(fresh);
      if (phone) showWhatsappToast(phone);
      router.push('/tableau-de-bord');
    },
    onError: (err: unknown) => {
      const apiMsg = getApiErrorMessage(err);
      toast.error(apiMsg ?? 'Publication impossible');
    },
  });

  const commissionPercent = getPublicCommissionPercent();

  function onPublish() {
    if (kycBlocksPublish) {
      toast.error('KYC verification required — terminez la vérification d’identité.');
      return;
    }
    const v = form.getValues();
    const major = Number(v.amountWantedMajor);
    if (!Number.isFinite(major) || major <= 0) {
      toast.error('Montant invalide');
      return;
    }
    const amountWanted = majorToMinor(major);
    if (amountWanted < MIN_REQUEST_AMOUNT_MINOR) {
      toast.error('Montant trop faible (minimum 1 unité affichée).');
      return;
    }
    const phoneApi = flexiblePhoneToApi(v.phoneToSend.trim());
    if (!phoneApi) {
      toast.error('Numéro invalide');
      return;
    }
    mutation.mutate({
      type: v.type as RequestType,
      amountWanted,
      paymentMethod: v.paymentMethod,
      phoneToSend: phoneApi,
      ...(v.note?.trim() ? { note: v.note.trim() } : {}),
    });
  }

  const resultMinor =
    calc && amountMinor >= MIN_REQUEST_AMOUNT_MINOR
      ? Math.round(parseDecimalLike(calc.result))
      : 0;
  const sendMinor = resultMinor;
  const commissionMinorFromApi =
    calc?.commissionAmount != null
      ? Math.round(parseDecimalLike(calc.commissionAmount))
      : null;
  /** Commission en unités mineures de la devise d’envoi (CFA si NEED_RUB, RUB si NEED_CFA). */
  const estimatedCommissionSendMinor =
    sendMinor > 0
      ? Math.round((sendMinor * commissionPercent) / 100)
      : 0;
  const commissionInSendMinor =
    commissionMinorFromApi != null &&
    commissionMinorFromApi > 0 &&
    amountMinor > 0
      ? Math.round((commissionMinorFromApi * sendMinor) / amountMinor)
      : estimatedCommissionSendMinor;
  const totalSendMinor = sendMinor + commissionInSendMinor;
  const commissionDisplaySecondary =
    commissionMinorFromApi != null && commissionMinorFromApi > 0
      ? watchedType === 'NEED_RUB'
        ? formatRUB(commissionMinorFromApi)
        : formatCFA(commissionMinorFromApi)
      : null;
  const commissionSecondaryLabel =
    commissionDisplaySecondary != null
      ? `Soit ${commissionDisplaySecondary} (réf. API).`
      : null;

  const googleRatePerCfa =
    rateData?.rate != null && rateData.rate > 0 ? rateData.rate : (calc?.rate ?? 0);

  const kycBlocksPublish = me != null && me.kycStatus !== 'VERIFIED';
  const cfaNetWarning =
    watchedType === 'NEED_RUB' &&
    resultMinor > 0 &&
    isNetXofOutsideTypicalRange(resultMinor);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink">Nouvelle demande</h1>

      {kycBlocksPublish ? (
        <div className="rounded-card border border-warning/30 bg-warning/10 p-4 text-sm text-ink-secondary">
          <p className="font-semibold text-warning">Vérification d’identité requise</p>
          <p className="mt-1">
            La publication est réservée aux comptes <strong className="text-ink">KYC vérifiés</strong>.
            Sans cela, l’API répond <code className="rounded bg-muted px-1 text-xs">403</code> avec le
            message <code className="rounded bg-muted px-1 text-xs">KYC verification required</code>.
          </p>
          <Link
            href="/kyc"
            className="mt-3 inline-block text-sm font-medium text-primary underline"
          >
            Terminer ma vérification →
          </Link>
        </div>
      ) : null}

      <p className="rounded-input border border-line bg-surface/60 p-3 text-xs text-ink-muted">
        Les montants envoyés à l’API sont en <strong className="text-ink">centimes / kopecks</strong>{' '}
        (ex. 1 000 ₽ affichés → <code className="rounded bg-muted px-1">100000</code> kopecks). Le corps
        de <code className="rounded bg-muted px-1">POST /requests</code> ne contient que :{' '}
        <code className="rounded bg-muted px-1">type</code>,{' '}
        <code className="rounded bg-muted px-1">amountWanted</code>,{' '}
        <code className="rounded bg-muted px-1">paymentMethod</code>,{' '}
        <code className="rounded bg-muted px-1">phoneToSend</code>,{' '}
        <code className="rounded bg-muted px-1">note</code> (optionnel).
      </p>

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
          <div className="space-y-2">
            <p className="text-sm font-medium text-ink-secondary">
              Détail de votre échange (estimation)
            </p>
            {calc && amountMinor >= MIN_REQUEST_AMOUNT_MINOR ? (
              <CommissionBreakdown
                type={watchedType}
                googleRatePerCfa={googleRatePerCfa}
                percentChange24h={rateData?.percentChange ?? 0}
                trend={rateData?.trend ?? 'stable'}
                fetchedAt={rateData?.fetchedAt ?? null}
                netSendMinor={sendMinor}
                commissionPercent={commissionPercent}
                commissionSendMinor={commissionInSendMinor}
                totalSendMinor={totalSendMinor}
                receiveMinor={amountMinor}
                commissionSecondaryLabel={commissionSecondaryLabel}
                compact
              />
            ) : (
              <p className="rounded-input border border-line bg-surface/80 p-3 text-xs text-ink-muted">
                Saisissez un montant valide pour voir le détail (taux Google + commission séparée).
              </p>
            )}
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={async () => {
              const ok = await form.trigger('amountWantedMajor');
              if (ok && amountMinor >= MIN_REQUEST_AMOUNT_MINOR) setStep(2);
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
              placeholder="22370123456 ou 79961234567"
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

          <Card className="space-y-4 border-primary/20 bg-gradient-to-br from-card to-primary/[0.04] p-5 text-sm">
            <p className="font-display font-semibold text-ink">Récapitulatif</p>
            {calc && amountMinor >= MIN_REQUEST_AMOUNT_MINOR ? (
              <CommissionBreakdown
                type={watchedType}
                googleRatePerCfa={googleRatePerCfa}
                percentChange24h={rateData?.percentChange ?? 0}
                trend={rateData?.trend ?? 'stable'}
                fetchedAt={rateData?.fetchedAt ?? null}
                netSendMinor={sendMinor}
                commissionPercent={commissionPercent}
                commissionSendMinor={commissionInSendMinor}
                totalSendMinor={totalSendMinor}
                receiveMinor={amountMinor}
                commissionSecondaryLabel={commissionSecondaryLabel}
              />
            ) : null}
            <div className="flex justify-between border-t border-line pt-3">
              <span className="text-ink-muted">Sur quel numéro envoyer ?</span>
              <span className="text-right font-medium text-ink">
                {PAYMENT_METHOD_LABELS[form.watch('paymentMethod')]}
              </span>
            </div>
            <p className="rounded-input border border-primary/20 bg-primary/[0.04] p-3 text-xs text-ink-secondary">
              Après prise en charge, vous recevrez les instructions pour envoyer le{' '}
              <strong className="text-ink">montant total</strong> sur un{' '}
              <strong className="text-ink">numéro SwapTrust officiel</strong> (jamais directement
              sur le portable de l’opérateur).
            </p>
            <p className="rounded-input border border-warning/30 bg-warning/10 p-3 text-xs text-ink-secondary">
              Le taux est verrouillé au moment de la publication. Un opérateur prendra en
              charge votre demande sous peu.
            </p>
            {cfaNetWarning ? (
              <p className="rounded-input border border-warning/25 bg-warning/5 p-3 text-xs text-ink-secondary">
                Le montant CFA estimé sort souvent des limites serveur (ordre de grandeur 5 000 – 500 000 F).
                En cas d’échec, le message renvoyé par l’API (ex. « Montant CFA hors limites ») s’affichera
                ci-dessus.
              </p>
            ) : null}
            <Button
              type="button"
              className="w-full"
              loading={mutation.isPending}
              disabled={kycBlocksPublish}
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
