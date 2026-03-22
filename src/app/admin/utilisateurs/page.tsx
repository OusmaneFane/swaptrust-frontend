'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi, kycApi } from '@/services/api';
import type { User } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn, fullDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [kycFilter, setKycFilter] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users', kycFilter],
    queryFn: () =>
      adminApi.users(
        kycFilter ? { kycStatus: kycFilter } : undefined,
      ),
  });

  const { data: pendingDocs = [] } = useQuery({
    queryKey: ['admin', 'kyc', 'pending'],
    queryFn: () => adminApi.kycPending(),
  });

  const pendingDocIdByUserId = useMemo(() => {
    const m = new Map<number, number>();
    for (const d of pendingDocs) {
      if (d.status === 'PENDING') m.set(d.userId, d.id);
    }
    return m;
  }, [pendingDocs]);

  const banMut = useMutation({
    mutationFn: (id: number) => adminApi.banUser(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Utilisateur banni');
    },
    onError: () => toast.error('Action impossible'),
  });

  const invalidateKyc = () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    void qc.invalidateQueries({ queryKey: ['admin', 'kyc', 'pending'] });
    void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  };

  const approveMut = useMutation({
    mutationFn: (documentId: number) => kycApi.approve(documentId),
    onSuccess: () => {
      invalidateKyc();
      toast.success('KYC approuvé');
    },
    onError: () => toast.error('Approbation impossible'),
  });

  const rejectMut = useMutation({
    mutationFn: ({ documentId, note }: { documentId: number; note: string }) =>
      kycApi.reject(documentId, note),
    onSuccess: () => {
      invalidateKyc();
      toast.success('KYC rejeté');
    },
    onError: () => toast.error('Rejet impossible'),
  });

  function kycDocIdForUser(userId: number): number | undefined {
    return pendingDocIdByUserId.get(userId);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            Utilisateurs
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-secondary">
            Bannissement :{' '}
            <code className="rounded bg-muted px-1 font-mono text-xs">
              PUT /admin/users/{'{id}'}/ban
            </code>
            . KYC : actions sur l’id du{' '}
            <strong className="text-ink">dossier</strong> (
            <code className="rounded bg-muted px-1 font-mono text-xs">
              GET /admin/kyc/pending
            </code>
            ).
          </p>
        </div>
        <select
          className="rounded-input border border-line bg-card px-4 py-2.5 text-sm font-medium text-ink shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={kycFilter}
          onChange={(e) => setKycFilter(e.target.value)}
        >
          <option value="">Tous KYC</option>
          <option value="PENDING">En attente</option>
          <option value="VERIFIED">Vérifié</option>
          <option value="REJECTED">Rejeté</option>
          <option value="NOT_SUBMITTED">Non soumis</option>
        </select>
      </div>
      <Card className="overflow-hidden border-line/90 p-0 shadow-card-lg">
        {isLoading ? (
          <Skeleton className="m-4 h-40 rounded-card" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line bg-surface/80 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="p-4 font-medium">Nom</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">KYC</th>
                  <th className="p-4 font-medium">Échanges</th>
                  <th className="p-4 font-medium">Note</th>
                  <th className="p-4 font-medium">Inscrit</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-card">
                {users.map((u: User) => {
                  const docId =
                    u.kycStatus === 'PENDING'
                      ? kycDocIdForUser(u.id)
                      : undefined;
                  return (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-surface-hover/80"
                    >
                      <td className="p-4 font-semibold text-ink">{u.name}</td>
                      <td className="p-4 text-ink-secondary">{u.email}</td>
                      <td className="p-4">
                        <span
                          className={cn(
                            'inline-flex rounded-pill px-2.5 py-0.5 text-xs font-semibold',
                            u.kycStatus === 'VERIFIED' && 'bg-success/15 text-success',
                            u.kycStatus === 'PENDING' && 'bg-warning/15 text-warning',
                            u.kycStatus === 'REJECTED' && 'bg-danger/10 text-danger',
                            u.kycStatus === 'NOT_SUBMITTED' &&
                              'bg-muted text-ink-muted',
                          )}
                        >
                          {u.kycStatus}
                        </span>
                      </td>
                      <td className="p-4 text-ink-secondary">
                        {u.transactionsCount}
                      </td>
                      <td className="p-4 text-ink-secondary">
                        {u.ratingAvg?.toFixed(1) ?? '—'}
                      </td>
                      <td className="p-4 text-xs text-ink-faint">
                        {fullDate(u.createdAt)}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5">
                          {u.kycStatus === 'PENDING' && docId != null ? (
                            <>
                              <Button
                                type="button"
                                className="py-1.5 text-xs"
                                loading={approveMut.isPending}
                                onClick={() => approveMut.mutate(docId)}
                              >
                                KYC ✓
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="border-line py-1.5 text-xs"
                                loading={rejectMut.isPending}
                                onClick={() => {
                                  const note = window.prompt('Motif ?') ?? '';
                                  if (note.trim()) {
                                    rejectMut.mutate({ documentId: docId, note });
                                  }
                                }}
                              >
                                KYC ✗
                              </Button>
                            </>
                          ) : u.kycStatus === 'PENDING' ? (
                            <span className="text-xs text-ink-faint">
                              Dossier introuvable
                            </span>
                          ) : null}
                          <Button
                            type="button"
                            variant="outline"
                            className="border-danger/35 py-1.5 text-xs text-danger hover:bg-danger/5"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Bannir ${u.name} ? Cette action est sensible.`,
                                )
                              ) {
                                banMut.mutate(u.id);
                              }
                            }}
                          >
                            Bannir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && !users.length ? (
          <p className="p-8 text-center text-sm text-ink-muted">Aucun utilisateur.</p>
        ) : null}
      </Card>
    </div>
  );
}
