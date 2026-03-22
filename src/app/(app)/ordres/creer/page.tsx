'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { StepIndicator } from '@/components/exchange/StepIndicator';
import { ExchangeCalculator } from '@/components/exchange/ExchangeCalculator';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { ordersApi, ratesApi } from '@/services/api';
import { formatOrderCreateError } from '@/lib/format-order-error';
import { cn } from '@/lib/utils';

const stepLabels = ['Type', 'Montant', 'Réception', 'Récap'];

const step2Schema = z.object({
  amount: z.string().min(1, 'Montant requis'),
});

const step3Schema = z.object({
  phoneReceive: z.string().min(6, 'Numéro requis'),
  paymentMethod: z.enum([
    'ORANGE_MONEY',
    'WAVE',
    'BANK_TRANSFER',
    'SBP',
    'OTHER',
  ]),
  note: z.string().optional(),
});

export default function CreerOrdrePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [orderType, setOrderType] = useState<'SEND_CFA' | 'SEND_RUB'>('SEND_CFA');
  const { data: rateData } = useExchangeRate();
  const rate = rateData?.rate ?? 0.14;

  const form2 = useForm<z.infer<typeof step2Schema>>({
    resolver: zodResolver(step2Schema),
  });

  const amountMajor = Number(form2.watch('amount') || 0);
  const { data: calc } = useQuery({
    queryKey: ['rates', 'calculate', amountMajor, orderType],
    queryFn: () =>
      ratesApi.calculate(
        amountMajor,
        orderType === 'SEND_CFA' ? 'XOF' : 'RUB',
        orderType === 'SEND_CFA' ? 'RUB' : 'XOF',
      ),
    enabled: amountMajor > 0,
  });

  const createMut = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: () => {
      toast.success('Offre publiée !');
      router.push('/ordres');
    },
    onError: (err: unknown) => toast.error(formatOrderCreateError(err)),
  });

  const form3 = useForm<z.infer<typeof step3Schema>>({
    resolver: zodResolver(step3Schema),
    defaultValues: { paymentMethod: 'ORANGE_MONEY' },
  });

  const amountCents = Math.round(Number(form2.watch('amount') || 0) * 100);

  function publish() {
    const v3 = form3.getValues();
    if (amountCents <= 0) {
      toast.error('Montant invalide');
      return;
    }
    createMut.mutate({
      type: orderType,
      amountFrom: amountCents,
      currencyFrom: orderType === 'SEND_CFA' ? 'XOF' : 'RUB',
      currencyTo: orderType === 'SEND_CFA' ? 'RUB' : 'XOF',
      paymentMethod: v3.paymentMethod,
      phoneReceive: v3.phoneReceive.trim(),
      ...(v3.note?.trim() ? { note: v3.note.trim() } : {}),
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-2xl font-bold">Créer un ordre</h1>
      <StepIndicator step={step} total={4} labels={stepLabels} />

      {step === 1 ? (
        <Card className="space-y-4">
          <p className="text-sm text-ink-secondary">Que souhaitez-vous envoyer ?</p>
          <div className="grid gap-3">
            {(
              [
                { id: 'SEND_CFA' as const, title: 'J’envoie des CFA', sub: 'Vers roubles' },
                { id: 'SEND_RUB' as const, title: 'J’envoie des roubles', sub: 'Vers CFA' },
              ] as const
            ).map(({ id, title, sub }) => (
              <button
                key={id}
                type="button"
                onClick={() => setOrderType(id)}
                className={cn(
                  'rounded-card border p-4 text-left transition-colors',
                  orderType === id
                    ? 'border-primary bg-primary/15'
                    : 'border-line hover:border-line',
                )}
              >
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-ink-muted">{sub}</p>
              </button>
            ))}
          </div>
          <Button type="button" className="w-full" onClick={() => setStep(2)}>
            Continuer
          </Button>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="space-y-4">
          <form
            onSubmit={form2.handleSubmit(() => setStep(3))}
            className="space-y-4"
          >
            <Input
              label="Montant (unités)"
              type="number"
              step="0.01"
              error={form2.formState.errors.amount?.message}
              {...form2.register('amount')}
            />
            <ExchangeCalculator
              amountCents={amountCents}
              direction={orderType}
              rate={rate}
            />
            {calc ? (
              <p className="rounded-input border border-line bg-surface px-3 py-2 text-xs text-ink-secondary">
                Simulation API : montant converti ≈{' '}
                <strong className="text-ink">{calc.result}</strong> (taux{' '}
                {calc.rate})
              </p>
            ) : null}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Retour
              </Button>
              <Button type="submit" className="flex-1">
                Suivant
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="space-y-4">
          <form
            onSubmit={form3.handleSubmit(() => setStep(4))}
            className="space-y-4"
          >
            <Input
              label="Numéro de réception"
              error={form3.formState.errors.phoneReceive?.message}
              {...form3.register('phoneReceive')}
            />
            <div>
              <label className="mb-2 block text-sm text-ink-secondary">Méthode</label>
              <select className="input-field" {...form3.register('paymentMethod')}>
                <option value="ORANGE_MONEY">Orange Money</option>
                <option value="WAVE">Wave</option>
                <option value="BANK_TRANSFER">Virement</option>
                <option value="SBP">SBP</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <Input label="Note (optionnel)" {...form3.register('note')} />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Retour
              </Button>
              <Button type="submit" className="flex-1">
                Suivant
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {step === 4 ? (
        <Card className="space-y-4 text-sm text-ink-secondary">
          <p>Type : {orderType}</p>
          <p>Montant saisi : {form2.watch('amount')}</p>
          <p>Réception : {form3.watch('phoneReceive')}</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(3)}>
              Retour
            </Button>
            <Button
              type="button"
              className="flex-1"
              loading={createMut.isPending}
              onClick={() => publish()}
            >
              Publier mon offre
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
