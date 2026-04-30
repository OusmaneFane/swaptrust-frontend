'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import type { PaymentMethod } from '@/types/order';
import type { RequestType } from '@/types/request';
import {
  type FormGridPaymentMethod,
  PAYMENT_METHOD_BRAND_IMAGE,
  PAYMENT_METHOD_LABELS,
  paymentMethodsForRequestType,
} from '@/constants/payment-methods';
import { cn } from '@/lib/utils';

/** Taille visuelle des logos (fallback identique). */
const imgBox =
  'relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-black/[0.06] sm:h-16 sm:w-16';

function BrandImage({
  method,
  className,
}: {
  method: FormGridPaymentMethod;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = PAYMENT_METHOD_BRAND_IMAGE[method];
  const label = PAYMENT_METHOD_LABELS[method];
  const initials = label
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const onError = useCallback(() => setFailed(true), []);

  if (failed) {
    return (
      <span
        className={cn(
          imgBox,
          'bg-slate-100 text-sm font-bold text-slate-500 ring-slate-200/80',
          className,
        )}
        aria-hidden
      >
        {initials}
      </span>
    );
  }

  return (
    <span className={cn(imgBox, className)}>
      <Image
        src={src}
        alt=""
        width={64}
        height={64}
        className="max-h-full max-w-full object-contain p-1.5 sm:p-2"
        loading="lazy"
        onError={onError}
      />
    </span>
  );
}

type Props = {
  requestType: RequestType;
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  error?: string;
};

export function PaymentMethodGrid({
  requestType,
  value,
  onChange,
  error,
}: Props) {
  const methods = paymentMethodsForRequestType(requestType);
  return (
    <div className="min-w-0 space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
        Moyen d’envoi
      </p>
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        role="listbox"
        aria-label="Méthode de paiement"
      >
        {methods.map((method) => {
          const selected = value === method;
          return (
            <button
              key={method}
              type="button"
              role="option"
              aria-selected={selected}
              title={PAYMENT_METHOD_LABELS[method]}
              onClick={() => onChange(method)}
              className={cn(
                'relative flex min-h-[8.5rem] min-w-0 flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 text-center transition-all',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                selected
                  ? 'border-primary bg-primary/[0.07] shadow-md ring-1 ring-primary/15'
                  : 'border-primary/10 bg-white hover:border-primary/30 hover:shadow-card',
              )}
            >
              {selected ? (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                </span>
              ) : null}
              <BrandImage method={method} />
              <span className="line-clamp-2 w-full text-xs font-semibold leading-snug text-text-dark sm:text-sm">
                {PAYMENT_METHOD_LABELS[method]}
              </span>
            </button>
          );
        })}
      </div>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
