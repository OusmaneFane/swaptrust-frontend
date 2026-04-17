'use client';

import { useEffect, useState } from 'react';

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function RequestExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const [left, setLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    const t = setInterval(() => {
      setLeft(
        Math.max(
          0,
          Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
        ),
      );
    }, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  if (left <= 0) {
    return <span className="text-sm text-danger">Expirée</span>;
  }

  return (
    <div className="space-y-1">
      <p className="font-mono text-sm font-semibold text-text-dark">
        Expire dans {formatMmSs(left)}
      </p>
      <p className="text-xs text-text-muted">
        Nos opérateurs sont joignables en journée ; vous serez notifié dès qu’une prise en
        charge est faite.
      </p>
    </div>
  );
}
