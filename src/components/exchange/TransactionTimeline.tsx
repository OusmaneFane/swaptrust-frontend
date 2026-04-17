'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { TransactionStatus } from '@/types';
import {
  CLIENT_TRANSACTION_FLOW,
  clientTimelineStepIndex,
  TRANSACTION_STEPS,
} from '@/types/transaction';
import { cn } from '@/lib/utils';

const WHATSAPP_ICON_PATH =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';

function isStepReached(status: TransactionStatus, stepIndex: number): boolean {
  if (status === 'DISPUTED' || status === 'CANCELLED') return false;
  if (status === 'COMPLETED') return true;
  return clientTimelineStepIndex(status) >= stepIndex;
}

function NotificationBadge({
  stepIndex,
  status,
}: {
  stepIndex: number;
  status: TransactionStatus;
}) {
  if (status === 'DISPUTED' || status === 'CANCELLED') return null;

  if (isStepReached(status, stepIndex)) {
    return (
      <div className="mt-1 flex items-center gap-1">
        <svg
          viewBox="0 0 24 24"
          className="h-2.5 w-2.5 shrink-0 opacity-70"
          fill="#25D366"
          aria-hidden
        >
          <path d={WHATSAPP_ICON_PATH} />
        </svg>
        <span className="text-xs text-slate-500">Notifié par WhatsApp</span>
      </div>
    );
  }

  return (
    <div className="mt-1 flex items-center gap-1">
      <span className="text-xs text-slate-500">Notification WhatsApp en attente</span>
    </div>
  );
}

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
      <div className="rounded-card border border-danger/35 bg-red-50/70 p-4 text-danger shadow-card">
        <p className="font-semibold">{s.label}</p>
        <p className="text-sm text-slate-700">{s.description}</p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-0 rounded-card border border-primary/10 bg-white p-5 shadow-card">
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
                  !done && !current && 'border-primary/15 text-slate-400',
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
                    done ? 'bg-success/40' : 'bg-slate-200',
                  )}
                />
              ) : null}
            </div>
            <div className={cn('pb-8', i === CLIENT_TRANSACTION_FLOW.length - 1 && 'pb-0')}>
              <p
                className={cn(
                  'font-semibold',
                  current ? 'text-text-dark' : 'text-slate-600',
                )}
              >
                {meta.label}
              </p>
              <p className="text-sm text-text-muted">{meta.description}</p>
              <NotificationBadge stepIndex={i} status={status} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
