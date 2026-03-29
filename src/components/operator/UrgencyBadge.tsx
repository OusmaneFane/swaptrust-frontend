'use client';

export function UrgencyBadge({ expiresAt }: { expiresAt: string }) {
  const minutesLeft = Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - Date.now()) / 60_000),
  );
  if (minutesLeft <= 10) {
    return (
      <span className="animate-pulse text-xs text-danger">
        Expire dans {minutesLeft} min
      </span>
    );
  }
  if (minutesLeft <= 20) {
    return (
      <span className="text-xs text-warning">Expire dans {minutesLeft} min</span>
    );
  }
  return (
    <span className="text-xs text-ink-faint">Expire dans {minutesLeft} min</span>
  );
}
