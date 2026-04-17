'use client';

import type { UseFormRegisterReturn } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { flagCdnUrl, PHONE_SEND_DIAL_OPTIONS } from '@/constants/phone-send-dial';
import { phoneDialForRequestType } from '@/lib/phone-api-format';
import type { RequestType } from '@/types';
import { cn } from '@/lib/utils';

type Props = {
  requestType: RequestType;
  nationalRegister: UseFormRegisterReturn;
  nationalError?: string;
};

export function PhoneDialNationalFields({
  requestType,
  nationalRegister,
  nationalError,
}: Props) {
  const dial = phoneDialForRequestType(requestType);
  const opt = PHONE_SEND_DIAL_OPTIONS.find((o) => o.dial === dial);
  const placeholder = opt?.placeholder ?? '';

  return (
    <div className="min-w-0 space-y-3">
      <div>
        <p className="mb-2 text-sm font-medium text-slate-600">Pays / indicatif</p>
        <div
          className={cn(
            'flex min-h-[5.5rem] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-primary/15 bg-primary/[0.04] p-4',
          )}
          role="status"
          aria-label={`Indicatif ${opt?.label ?? ''} +${opt?.dialDisplay ?? ''}`}
        >
          <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-black/[0.06]">
            {opt ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={flagCdnUrl(opt.iso2, 80)}
                alt=""
                width={80}
                height={56}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : null}
          </span>
          <span className="text-sm font-semibold text-text-dark">{opt?.label}</span>
          <span className="text-xs font-medium tabular-nums text-text-muted">
            +{opt?.dialDisplay}
            <span className="sr-only">
              {requestType === 'NEED_CFA'
                ? ' — lié à une demande en francs CFA'
                : ' — lié à une demande en roubles'}
            </span>
          </span>
        </div>
      </div>
      <Input
        label="Numéro (sans indicatif)"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder={placeholder}
        error={nationalError}
        {...nationalRegister}
      />
      <p className="text-xs text-text-muted">
        Envoyé à l’API en un seul bloc, chiffres uniquement, sans « + »
        {dial === '223' ? (
          <>
            {' '}
            (ex. <span className="font-mono tabular-nums">22370123456</span>).
          </>
        ) : (
          <>
            {' '}
            (ex. <span className="font-mono tabular-nums">79161234567</span>).
          </>
        )}
      </p>
    </div>
  );
}
