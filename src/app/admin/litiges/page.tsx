'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi, disputesApi } from '@/services/api';
import type { Dispute } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { fullDate } from '@/lib/utils';

export default function AdminLitigesPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [resolution, setResolution] = useState('');

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin', 'disputes'],
    queryFn: () => adminApi.disputes(),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['disputes', 'detail', selectedId],
    queryFn: () => disputesApi.getById(selectedId!),
    enabled: selectedId != null && Number.isFinite(selectedId),
  });

  const resolveMut = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) =>
      adminApi.resolveDispute(id, text),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'disputes'] });
      void qc.invalidateQueries({ queryKey: ['disputes', 'detail'] });
      toast.success('Décision enregistrée — les clients seront notifiés.');
      setSelectedId(null);
      setResolution('');
    },
    onError: () => toast.error('Résolution impossible'),
  });

  function openRow(d: Dispute) {
    setSelectedId(d.id);
    setResolution(d.resolution ?? '');
  }

  function closeSheet() {
    setSelectedId(null);
    setResolution('');
  }

  const d = detail;

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-accent/25 bg-accent-soft/40 px-5 py-4 text-sm text-ink-secondary shadow-sm">
        <strong className="font-semibold text-ink">Litiges.</strong> Liste :{' '}
        <code className="rounded bg-card px-1.5 py-0.5 font-mono text-xs shadow-sm">
          GET /admin/disputes
        </code>
        . Détail :{' '}
        <code className="rounded bg-card px-1.5 py-0.5 font-mono text-xs shadow-sm">
          GET /disputes/{'{id}'}
        </code>
        . Trancher :{' '}
        <code className="rounded bg-card px-1.5 py-0.5 font-mono text-xs shadow-sm">
          PUT /admin/disputes/{'{id}'}/resolve
        </code>
        .
      </div>
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
        Litiges
      </h1>
      <Card className="overflow-hidden border-line/90 p-0 shadow-card-lg">
        {isLoading ? (
          <Skeleton className="m-4 h-40 rounded-card" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-line bg-surface/80 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="p-4 font-medium">ID</th>
                  <th className="p-4 font-medium">Transaction</th>
                  <th className="p-4 font-medium">Raison</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-card">
                {rows.map((row: Dispute) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer transition-colors hover:bg-surface-hover/80"
                    onClick={() => openRow(row)}
                  >
                    <td className="p-4 font-semibold text-ink">#{row.id}</td>
                    <td className="p-4 text-ink-secondary">
                      #{row.transaction.id}
                    </td>
                    <td className="max-w-[220px] truncate p-4 text-ink-secondary">
                      {row.reason}
                    </td>
                    <td className="p-4">
                      <span className="rounded-pill bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning">
                        {row.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-ink-faint">
                      {fullDate(row.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && !rows.length ? (
          <p className="p-8 text-center text-sm text-ink-muted">Aucun litige ouvert.</p>
        ) : null}
      </Card>

      <BottomSheet
        open={selectedId != null}
        onClose={closeSheet}
        title={d ? `Litige #${d.id}` : selectedId ? `Litige #${selectedId}` : ''}
      >
        {detailLoading && selectedId != null ? (
          <Skeleton className="h-32 w-full rounded-card" />
        ) : d ? (
          <div className="space-y-4 text-sm text-ink-secondary">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Transaction
              </p>
              <p className="font-display font-semibold text-ink">#{d.transaction.id}</p>
              <p className="mt-1 text-xs text-ink-muted">
                Montants & statut escrow : voir la transaction côté API.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Motif initial
              </p>
              <p className="text-ink">{d.reason}</p>
            </div>
            {d.counterpartyResponse ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Réponse de l’autre partie
                </p>
                <p className="rounded-input border border-line bg-surface/80 p-3 text-ink">
                  {d.counterpartyResponse}
                </p>
              </div>
            ) : (
              <p className="rounded-input border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-ink-secondary">
                En attente d’une réponse client via{' '}
                <code className="rounded bg-card px-1 font-mono text-[11px]">
                  POST /disputes/{d.id}/respond
                </code>{' '}
                avant de trancher.
              </p>
            )}
            {d.attachments?.length ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Pièces jointes
                </p>
                <ul className="space-y-1">
                  {d.attachments.map((a, i) => (
                    <li key={i}>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        {a.label ?? a.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {d.status === 'RESOLVED' || d.status === 'CLOSED' ? (
              <p className="text-xs text-ink-muted">
                Dossier clos
                {d.resolution ? ` — ${d.resolution}` : ''}
              </p>
            ) : (
              <>
                <textarea
                  className="input-field min-h-[100px] resize-y"
                  rows={4}
                  placeholder="Décision écrite (notifiée aux deux clients)"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                />
                <Button
                  type="button"
                  className="w-full shadow-md shadow-primary/20"
                  loading={resolveMut.isPending}
                  onClick={() => {
                    const text = resolution.trim();
                    if (!text) {
                      toast.error('Saisissez votre décision');
                      return;
                    }
                    resolveMut.mutate({ id: d.id, text });
                  }}
                >
                  Enregistrer la décision
                </Button>
              </>
            )}
          </div>
        ) : selectedId != null ? (
          <p className="text-sm text-ink-muted">Détail indisponible.</p>
        ) : null}
      </BottomSheet>
    </div>
  );
}
