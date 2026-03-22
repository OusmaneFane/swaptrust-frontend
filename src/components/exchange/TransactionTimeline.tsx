'use client';

import { motion } from 'framer-motion';
import type { TransactionStatus } from '@/types';
import { TRANSACTION_STEPS } from '@/types/transaction';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const FLOW: TransactionStatus[] = [
  'INITIATED',
  'SENDER_SENT',
  'RECEIVER_CONFIRMED',
  'RUB_SENT',
  'COMPLETED',
];

export function TransactionTimeline({ status }: { status: TransactionStatus }) {
  if (status === 'DISPUTED' || status === 'CANCELLED') {
    const s = TRANSACTION_STEPS[status];
    return (
      <div className="glass-card border-danger/40 bg-danger/5 p-4 text-danger">
        <p className="font-semibold">{s.label}</p>
        <p className="text-sm text-ink-secondary">{s.description}</p>
      </div>
    );
  }

  const activeIndex = FLOW.indexOf(status);

  return (
    <ol className="relative space-y-0">
      {FLOW.map((key, i) => {
        const meta = TRANSACTION_STEPS[key];
        const done = i < activeIndex;
        const current = i === activeIndex;
        return (
          <li key={key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <motion.div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold',
                  done && 'border-success bg-success/15 text-success',
                  current &&
                    'border-primary bg-primary/10 text-primary shadow-md shadow-primary/15',
                  !done && !current && 'border-line text-ink-faint',
                )}
                animate={current ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: current ? Infinity : 0, duration: 2 }}
              >
                {done ? <Check className="h-5 w-5" /> : meta.step}
              </motion.div>
              {i < FLOW.length - 1 ? (
                <div
                  className={cn(
                    'my-1 min-h-[24px] w-0.5 flex-1',
                    done ? 'bg-success/40' : 'bg-muted',
                  )}
                />
              ) : null}
            </div>
            <div className={cn('pb-8', i === FLOW.length - 1 && 'pb-0')}>
              <p
                className={cn(
                  'font-semibold',
                  current ? 'text-ink' : 'text-ink-secondary',
                )}
              >
                {meta.label}
              </p>
              <p className="text-sm text-ink-muted">{meta.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
