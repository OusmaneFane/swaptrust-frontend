'use client';

import { useMemo } from 'react';
import { formatCFA, formatRUB } from '@/lib/utils';
import { computeOrderAmounts } from '@/lib/order-amounts';

interface ExchangeCalculatorProps {
  amountCents: number;
  direction: 'SEND_CFA' | 'SEND_RUB';
  rate: number;
  commissionPct?: number;
}

export function ExchangeCalculator({
  amountCents,
  direction,
  rate,
  commissionPct = 2,
}: ExchangeCalculatorProps) {
  const { sent, commission, received } = useMemo(() => {
    const c = computeOrderAmounts({
      orderType: direction,
      amountCents,
      rate,
      commissionPct,
    });
    if (!c) return { sent: 0, commission: 0, received: 0 };
    return {
      sent: c.amountFrom,
      commission: c.commission,
      received: c.amountTo,
    };
  }, [amountCents, direction, rate, commissionPct]);

  return (
    <div className="glass-card space-y-3 p-4 text-sm">
      <Row
        label="Montant envoyé"
        value={direction === 'SEND_CFA' ? formatCFA(sent) : formatRUB(sent)}
      />
      <Row
        label={`Commission (${commissionPct}%)`}
        value={direction === 'SEND_CFA' ? formatCFA(commission) : formatRUB(commission)}
        muted
      />
      <div className="border-t border-line pt-3">
        <Row
          label="Montant reçu estimé"
          value={
            direction === 'SEND_CFA' ? formatRUB(received) : formatCFA(received)
          }
          emphasis
        />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  emphasis,
}: {
  label: string;
  value: string;
  muted?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className={muted ? 'text-ink-muted' : 'text-ink-secondary'}>{label}</span>
      <span
        className={
          emphasis ? 'font-semibold text-accent' : 'font-medium text-ink'
        }
      >
        {value}
      </span>
    </div>
  );
}
