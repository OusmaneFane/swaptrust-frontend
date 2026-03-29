'use client';

import { motion } from 'framer-motion';
import type { TransactionStatus } from '@/types';
import {
  CLIENT_TRANSACTION_FLOW,
  clientTimelineStepIndex,
  TRANSACTION_STEPS,
} from '@/types/transaction';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

function isStepDone(status: TransactionStatus, stepIndex: number): boolean {
  if (status === 'DISPUTED' || status === 'CANCELLED') return false;
  if (status === 'COMPLETED') return true;
  return clientTimelineStepIndex(status) > stepIndex;
}

function isStepCurrent(status: TransactionStatus, stepIndex: number): boolean {
  if (status === 'DISPUTED' || status === 'CANCELLED') return false;
  if (status === 'COMPLETED') return false;
  return clientTimelineStepIndex(status) === stepIndex;
}

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

  return (
    <ol className="relative space-y-0">
      {CLIENT_TRANSACTION_FLOW.map((meta, i) => {
        const done = isStepDone(status, i);
        const current = isStepCurrent(status, i);
        return (
          <li key={meta.label} className="flex gap-4">
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
                {done ? <Check className="h-5 w-5" /> : i + 1}
              </motion.div>
              {i < CLIENT_TRANSACTION_FLOW.length - 1 ? (
                <div
                  className={cn(
                    'my-1 min-h-[24px] w-0.5 flex-1',
                    done ? 'bg-success/40' : 'bg-muted',
                  )}
                />
              ) : null}
            </div>
            <div className={cn('pb-8', i === CLIENT_TRANSACTION_FLOW.length - 1 && 'pb-0')}>
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
