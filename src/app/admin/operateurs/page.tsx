'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi } from '@/services/api';
import type { User } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { RoleBadge } from '@/components/operator/RoleBadge';
import type { UserRole } from '@/types/user';
import { fullDate } from '@/lib/utils';

function roleOf(u: User): UserRole {
  return u.role ?? 'CLIENT';
}

export default function AdminOperateursPage() {
  const qc = useQueryClient();

  const { data: operators = [], isLoading } = useQuery({
    queryKey: ['admin', 'operators'],
    queryFn: () => adminApi.listOperators(),
  });

  const revokeMut = useMutation({
    mutationFn: (userId: number) => adminApi.revokeOperator(userId),
    onSuccess: () => {
      toast.success('Opérateur révoqué');
      void qc.invalidateQueries({ queryKey: ['admin', 'operators'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Action impossible'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-text-dark">
          Opérateurs
        </h1>
        <p className="mt-2 max-w-xl text-sm text-text-secondary">
          Comptes autorisés à matcher les ordres et exécuter les transferts. Révoquer
          repasse l’utilisateur en client (
          <code className="rounded bg-white px-1 font-mono text-xs text-text-muted shadow-sm ring-1 ring-slate-900/[0.06]">
            DELETE /admin/operators/{'{id}'}
          </code>
          ).
        </p>
      </div>

      <Card className="overflow-hidden p-0 shadow-lg">
        {isLoading ? (
          <Skeleton className="m-4 h-40 rounded-card" />
        ) : (
          <>
            <div className="divide-y divide-primary/10 bg-white md:hidden">
              {operators.map((u: User) => (
                <div key={u.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-text-dark">{u.name}</p>
                      <p className="mt-0.5 break-all text-sm text-text-secondary">{u.email}</p>
                    </div>
                    <RoleBadge role={roleOf(u)} />
                  </div>
                  <p className="mt-2 text-xs text-text-muted">{fullDate(u.createdAt)}</p>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full py-2 text-xs text-danger"
                      loading={revokeMut.isPending}
                      onClick={() => {
                        if (window.confirm(`Révoquer ${u.name} comme opérateur ?`)) {
                          revokeMut.mutate(u.id);
                        }
                      }}
                    >
                      Révoquer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="border-b border-primary/10 bg-white/70 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  <tr>
                    <th className="p-4 font-medium">Nom</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium">Rôle</th>
                    <th className="p-4 font-medium">Inscrit</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10 bg-white">
                  {operators.map((u: User) => (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-primary/[0.04]"
                    >
                      <td className="p-4 font-semibold text-text-dark">{u.name}</td>
                      <td className="p-4 text-text-secondary">{u.email}</td>
                      <td className="p-4">
                        <RoleBadge role={roleOf(u)} />
                      </td>
                      <td className="p-4 text-xs text-text-muted">
                        {fullDate(u.createdAt)}
                      </td>
                      <td className="p-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="py-1.5 text-xs text-danger"
                          loading={revokeMut.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Révoquer ${u.name} comme opérateur ?`,
                              )
                            ) {
                              revokeMut.mutate(u.id);
                            }
                          }}
                        >
                          Révoquer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {!isLoading && !operators.length ? (
          <p className="p-8 text-center text-sm text-text-muted">
            Aucun opérateur actif.
          </p>
        ) : null}
      </Card>
    </div>
  );
}
