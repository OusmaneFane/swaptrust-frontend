'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi, kycApi } from '@/services/api';
import type { User } from '@/types';
import type { UserRole } from '@/types/user';
import { RoleBadge } from '@/components/operator/RoleBadge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn, fullDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [kycFilter, setKycFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users', kycFilter, search],
    queryFn: () =>
      adminApi.users({
        ...(kycFilter ? { kycStatus: kycFilter } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      }),
  });

  const assignRoleMut = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: UserRole }) =>
      adminApi.assignRole(userId, role),
    onSuccess: (_, { role }) => {
      const msg =
        role === 'OPERATOR'
          ? 'Opérateur désigné avec succès'
          : 'Rôle mis à jour';
      toast.success(msg);
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'operators'] });
    },
    onError: () => toast.error('Impossible de modifier le rôle'),
  });

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
    mutationFn: (userId: number) => kycApi.approve(userId),
    onSuccess: () => {
      invalidateKyc();
      toast.success('KYC approuvé');
    },
    onError: () => toast.error('Approbation impossible'),
  });

  const rejectMut = useMutation({
    mutationFn: ({ userId, note }: { userId: number; note?: string }) =>
      kycApi.reject(userId, note),
    onSuccess: () => {
      invalidateKyc();
      toast.success('KYC rejeté');
    },
    onError: () => toast.error('Rejet impossible'),
  });

  function userActions(u: User) {
    const role = u.role ?? 'CLIENT';
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          {role === 'ADMIN' ? (
            <span className="text-xs text-text-muted">Admin principal</span>
          ) : (
            <>
              {role === 'CLIENT' ? (
                <button
                  type="button"
                  className="rounded-md border border-primary/20 bg-white px-2 py-1 text-xs font-semibold text-primary shadow-sm transition hover:bg-primary/[0.06]"
                  disabled={assignRoleMut.isPending}
                  onClick={() =>
                    assignRoleMut.mutate({
                      userId: u.id,
                      role: 'OPERATOR',
                    })
                  }
                >
                  Désigner opérateur
                </button>
              ) : null}
              {role === 'OPERATOR' ? (
                <button
                  type="button"
                  className="rounded-md border border-danger/25 bg-white px-2 py-1 text-xs font-semibold text-danger shadow-sm transition hover:bg-danger/[0.06]"
                  disabled={assignRoleMut.isPending}
                  onClick={() =>
                    assignRoleMut.mutate({
                      userId: u.id,
                      role: 'CLIENT',
                    })
                  }
                >
                  Révoquer opérateur
                </button>
              ) : null}
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {u.kycStatus === 'PENDING' ? (
            <>
              <Button
                type="button"
                className="py-1.5 text-xs"
                loading={approveMut.isPending}
                onClick={() => approveMut.mutate(u.id)}
              >
                KYC ✓
              </Button>
              <Button
                type="button"
                variant="outline"
                className="py-1.5 text-xs"
                loading={rejectMut.isPending}
                onClick={() => {
                  const note = window.prompt('Motif ? (optionnel)') ?? '';
                  rejectMut.mutate({
                    userId: u.id,
                    note: note.trim() || undefined,
                  });
                }}
              >
                KYC ✗
              </Button>
            </>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="py-1.5 text-xs text-danger"
            onClick={() => {
              if (window.confirm(`Bannir ${u.name} ? Cette action est sensible.`)) {
                banMut.mutate(u.id);
              }
            }}
          >
            Bannir
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-text-dark">
            Utilisateurs
          </h1>
          <p className="mt-2 max-w-xl text-sm text-text-secondary">
            Bannissement :{' '}
            <code className="rounded bg-white px-1 font-mono text-xs text-text-muted shadow-sm ring-1 ring-slate-900/[0.06]">
              PUT /admin/users/{'{id}'}/ban
            </code>
            . KYC :{' '}
            <code className="rounded bg-white px-1 font-mono text-xs text-text-muted shadow-sm ring-1 ring-slate-900/[0.06]">
              PUT /api/v1/kyc/admin/{'{userId}'}/approve|reject
            </code>
            .
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
          <Input
            variant="dark"
            label="Recherche"
            placeholder="Email ou nom…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="sm:min-w-[200px]">
            <label className="mb-2 block text-sm font-medium text-text-dark">
              Filtre KYC
            </label>
            <select
              className="input-field-surface w-full"
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
        </div>
      </div>
      <Card className="overflow-hidden p-0 shadow-lg">
        {isLoading ? (
          <Skeleton className="m-4 h-40 rounded-card" />
        ) : (
          <>
            <div className="divide-y divide-primary/10 bg-white md:hidden">
              {users.map((u: User) => {
                const role = u.role ?? 'CLIENT';
                return (
                  <div key={u.id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-text-dark">{u.name}</p>
                        <p className="mt-0.5 break-all text-sm text-text-secondary">{u.email}</p>
                      </div>
                      <RoleBadge role={role} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex rounded-pill px-2.5 py-0.5 text-xs font-semibold',
                          u.kycStatus === 'VERIFIED' && 'bg-success/15 text-success',
                          u.kycStatus === 'PENDING' && 'bg-warning/15 text-warning',
                          u.kycStatus === 'REJECTED' && 'bg-danger/10 text-danger',
                          u.kycStatus === 'NOT_SUBMITTED' && 'bg-muted text-text-muted',
                        )}
                      >
                        KYC: {u.kycStatus}
                      </span>
                      <span className="text-xs text-text-muted">
                        {u.transactionsCount} éch. · note {u.ratingAvg?.toFixed(1) ?? '—'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-text-muted">{fullDate(u.createdAt)}</p>
                    <div className="mt-3 border-t border-primary/10 pt-3">{userActions(u)}</div>
                  </div>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-primary/10 bg-white/70 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  <tr>
                    <th className="p-4 font-medium">Nom</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Rôle</th>
                    <th className="p-4 font-medium">KYC</th>
                    <th className="p-4 font-medium">Échanges</th>
                    <th className="p-4 font-medium">Note</th>
                    <th className="p-4 font-medium">Inscrit</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10 bg-white">
                  {users.map((u: User) => {
                    const role = u.role ?? 'CLIENT';
                    return (
                      <tr
                        key={u.id}
                        className="transition-colors hover:bg-primary/[0.04]"
                      >
                        <td className="p-4 font-semibold text-text-dark">{u.name}</td>
                        <td className="p-4 text-text-secondary">{u.email}</td>
                        <td className="p-4">
                          <RoleBadge role={role} />
                        </td>
                        <td className="p-4">
                          <span
                            className={cn(
                              'inline-flex rounded-pill px-2.5 py-0.5 text-xs font-semibold',
                              u.kycStatus === 'VERIFIED' && 'bg-success/15 text-success',
                              u.kycStatus === 'PENDING' && 'bg-warning/15 text-warning',
                              u.kycStatus === 'REJECTED' && 'bg-danger/10 text-danger',
                              u.kycStatus === 'NOT_SUBMITTED' &&
                                'bg-muted text-text-muted',
                            )}
                          >
                            {u.kycStatus}
                          </span>
                        </td>
                        <td className="p-4 text-text-secondary">
                          {u.transactionsCount}
                        </td>
                        <td className="p-4 text-text-secondary">
                          {u.ratingAvg?.toFixed(1) ?? '—'}
                        </td>
                        <td className="p-4 text-xs text-text-muted">
                          {fullDate(u.createdAt)}
                        </td>
                        <td className="p-4">{userActions(u)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
        {!isLoading && !users.length ? (
          <p className="p-8 text-center text-sm text-text-muted">Aucun utilisateur.</p>
        ) : null}
      </Card>
    </div>
  );
}
