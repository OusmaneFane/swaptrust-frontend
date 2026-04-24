'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Ban, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { PAYMENT_METHOD_LABELS } from '@/constants/payment-methods';
import type {
  AdminRevenueSummary,
  PlatformAccount,
  UpdatePlatformAccountDto,
} from '@/types';
import type { PaymentMethod } from '@/types/order';
import type { UseQueryResult } from '@tanstack/react-query';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { formatAccountForDisplay } from '@/lib/donisend-receive';
import { formatCFA } from '@/lib/utils';

const METHOD_OPTIONS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];

type FormState = {
  method: PaymentMethod;
  accountNumber: string;
  accountName: string;
  isActive: boolean;
};

function emptyForm(): FormState {
  return {
    method: 'ORANGE_MONEY',
    accountNumber: '',
    accountName: '',
    isActive: true,
  };
}

function formFromRow(row: PlatformAccount): FormState {
  return {
    method: row.method,
    accountNumber: row.accountNumber,
    accountName: row.accountName,
    isActive: row.isActive,
  };
}

export default function AdminPlatformAccountsPage() {
  const qc = useQueryClient();
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [dialog, setDialog] = useState<
    null | { mode: 'create' } | { mode: 'edit'; row: PlatformAccount }
  >(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'platform-accounts'],
    queryFn: () => adminApi.platformAccounts(),
    retry: false,
  });

  const revenueQuery = useQuery({
    queryKey: ['admin', 'revenue-summary', period],
    queryFn: () => adminApi.revenueSummary(period),
    retry: false,
  });

  function openCreate() {
    setForm(emptyForm());
    setDialog({ mode: 'create' });
  }

  function openEdit(row: PlatformAccount) {
    setForm(formFromRow(row));
    setDialog({ mode: 'edit', row });
  }

  function closeDialog() {
    setDialog(null);
  }

  const createMut = useMutation({
    mutationFn: adminApi.createPlatformAccount,
    onSuccess: () => {
      toast.success('Compte plateforme créé');
      void qc.invalidateQueries({ queryKey: ['admin', 'platform-accounts'] });
      closeDialog();
    },
    onError: (e: unknown) =>
      toast.error(getApiErrorMessage(e) ?? 'Création impossible'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdatePlatformAccountDto }) =>
      adminApi.updatePlatformAccount(id, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'platform-accounts'] });
      closeDialog();
    },
    onError: (e: unknown) =>
      toast.error(getApiErrorMessage(e) ?? 'Mise à jour impossible'),
  });

  const deleteMut = useMutation({
    mutationFn: adminApi.deletePlatformAccount,
    onSuccess: () => {
      toast.success('Compte désactivé');
      void qc.invalidateQueries({ queryKey: ['admin', 'platform-accounts'] });
    },
    onError: (e: unknown) =>
      toast.error(getApiErrorMessage(e) ?? 'Désactivation impossible'),
  });

  function submitForm() {
    const num = form.accountNumber.trim();
    const name = form.accountName.trim();
    if (!num || !name) {
      toast.error('Numéro / IBAN et nom affiché sont requis');
      return;
    }
    if (dialog?.mode === 'create') {
      createMut.mutate({
        method: form.method,
        accountNumber: num,
        accountName: name,
        isActive: form.isActive,
      });
      return;
    }
    if (dialog?.mode === 'edit') {
      updateMut.mutate(
        {
          id: dialog.row.id,
          dto: {
            accountNumber: num,
            accountName: name,
            isActive: form.isActive,
          },
        },
        { onSuccess: () => toast.success('Compte mis à jour') },
      );
    }
  }

  function confirmDeactivate(id: number) {
    if (
      !window.confirm(
        'Désactiver ce compte plateforme ? Les clients ne devront plus y être dirigés.',
      )
    ) {
      return;
    }
    deleteMut.mutate(id);
  }

  function reactivate(id: number) {
    updateMut.mutate(
      { id, dto: { isActive: true } },
      { onSuccess: () => toast.success('Compte réactivé') },
    );
  }

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs text-text-muted">
            <Link href="/admin" className="text-primary hover:underline">
              ← Tableau de bord
            </Link>
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-text-dark">
            Comptes DoniSend
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
            Réception centralisée des paiements clients avant transfert net aux opérateurs. Gestion
            via{' '}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-text-muted shadow-sm ring-1 ring-slate-900/[0.06]">
              /admin/platform-accounts
            </code>{' '}
            (GET, POST, PUT, DELETE).
          </p>
        </div>
        <Button
          type="button"
          className="shrink-0 gap-2 self-start sm:self-auto"
          onClick={() => openCreate()}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Ajouter un compte
        </Button>
      </div>

      <RevenueSummaryCard query={revenueQuery} />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <label className="text-xs font-medium text-text-muted">Période</label>
        <select
          className="input-field-surface"
          value={period}
          onChange={(e) => setPeriod(e.target.value as typeof period)}
        >
          <option value="day">Jour</option>
          <option value="week">Semaine</option>
          <option value="month">Mois</option>
          <option value="year">Année</option>
        </select>
      </div>

      {isLoading ? <Skeleton className="h-52 w-full rounded-card" /> : null}

      {isError ? (
        <Card className="border border-warning/25 bg-warning/10 p-4 text-sm text-text-secondary shadow-sm">
          <p className="font-medium text-text-dark">Chargement de la liste impossible</p>
          <p className="mt-1">
            {getApiErrorMessage(error) ?? 'Erreur réseau ou route absente.'}{' '}
            <button
              type="button"
              className="font-medium text-primary underline"
              onClick={() => void refetch()}
            >
              Réessayer
            </button>
          </p>
        </Card>
      ) : null}

      {!isLoading && !isError && data?.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 p-8 text-center shadow-sm">
          <p className="text-sm text-text-muted">Aucun compte enregistré.</p>
          <Button type="button" className="gap-2" onClick={() => openCreate()}>
            <Plus className="h-4 w-4" aria-hidden />
            Créer le premier compte
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError && data && data.length > 0 ? (
        <Card className="overflow-hidden p-0 shadow-lg">
          <div className="divide-y divide-primary/10 bg-white md:hidden">
            {data.map((row: PlatformAccount) => (
              <div key={row.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold text-text-dark">
                    {PAYMENT_METHOD_LABELS[row.method] ?? row.method}
                  </p>
                  <span
                    className={
                      row.isActive
                        ? 'rounded-pill bg-success/15 px-2 py-0.5 text-xs font-medium text-success'
                        : 'rounded-pill bg-muted px-2 py-0.5 text-xs font-medium text-text-muted'
                    }
                  >
                    {row.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <p className="mt-2 break-all font-mono text-xs text-text-secondary">
                  {formatAccountForDisplay(row.accountNumber)}
                </p>
                <p className="mt-1 text-sm text-text-secondary">{row.accountName}</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-1 px-3 py-2 text-xs sm:flex-1"
                    onClick={() => openEdit(row)}
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    Modifier
                  </Button>
                  {row.isActive ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-1 border-danger/30 px-3 py-2 text-xs text-danger hover:bg-danger/10 sm:flex-1"
                      disabled={deleteMut.isPending}
                      onClick={() => confirmDeactivate(row.id)}
                    >
                      <Ban className="h-3.5 w-3.5" aria-hidden />
                      Désactiver
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-1 px-3 py-2 text-xs sm:flex-1"
                      disabled={updateMut.isPending}
                      onClick={() => reactivate(row.id)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                      Réactiver
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-primary/10 bg-white/70 text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="p-4 font-semibold">Méthode</th>
                  <th className="p-4 font-semibold">Numéro / IBAN</th>
                  <th className="p-4 font-semibold">Nom affiché</th>
                  <th className="p-4 font-semibold">Statut</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row: PlatformAccount) => (
                  <tr key={row.id} className="border-b border-primary/10 last:border-0">
                    <td className="p-4 font-medium text-text-dark">
                      {PAYMENT_METHOD_LABELS[row.method] ?? row.method}
                    </td>
                    <td className="p-4 font-mono text-xs text-text-secondary">
                      {formatAccountForDisplay(row.accountNumber)}
                    </td>
                    <td className="p-4 text-text-secondary">{row.accountName}</td>
                    <td className="p-4">
                      <span
                        className={
                          row.isActive
                            ? 'rounded-pill bg-success/15 px-2 py-0.5 text-xs font-medium text-success'
                            : 'rounded-pill bg-muted px-2 py-0.5 text-xs font-medium text-text-muted'
                        }
                      >
                        {row.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-1 px-3 py-1.5 text-xs"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          Modifier
                        </Button>
                        {row.isActive ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="gap-1 border-danger/30 px-3 py-1.5 text-xs text-danger hover:bg-danger/10"
                            disabled={deleteMut.isPending}
                            onClick={() => confirmDeactivate(row.id)}
                          >
                            <Ban className="h-3.5 w-3.5" aria-hidden />
                            Désactiver
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="gap-1 px-3 py-1.5 text-xs"
                            disabled={updateMut.isPending}
                            onClick={() => reactivate(row.id)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                            Réactiver
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <Modal
        open={dialog != null}
        onClose={closeDialog}
        title={
          dialog?.mode === 'create'
            ? 'Nouveau compte plateforme'
            : dialog?.mode === 'edit'
              ? 'Modifier le compte'
              : undefined
        }
      >
        <div className="space-y-4">
          {dialog?.mode === 'edit' ? (
            <p className="text-xs text-text-muted">
              Méthode :{' '}
              <strong className="text-text-dark">
                {PAYMENT_METHOD_LABELS[dialog.row.method]}
              </strong>{' '}
              (non modifiable ici — créez un autre compte si besoin.)
            </p>
          ) : (
            <div>
              <label className="mb-2 block text-sm text-text-secondary">Méthode</label>
              <select
                className="input-field-surface w-full"
                value={form.method}
                onChange={(e) =>
                  setForm((f) => ({ ...f, method: e.target.value as PaymentMethod }))
                }
              >
                {METHOD_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Input
            variant="dark"
            label="Numéro ou IBAN"
            placeholder="+22370000000 ou ML00…"
            value={form.accountNumber}
            onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
          />
          <Input
            variant="dark"
            label="Nom affiché (client)"
            placeholder="DoniSend — Orange Money"
            value={form.accountName}
            onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              className="rounded border-primary/15 text-primary focus:ring-primary"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Compte actif (visible pour les nouvelles transactions)
          </label>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeDialog}>
              Annuler
            </Button>
            <Button type="button" loading={saving} onClick={() => submitForm()}>
              {dialog?.mode === 'create' ? 'Créer' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function RevenueSummaryCard({
  query,
}: {
  query: UseQueryResult<AdminRevenueSummary, Error>;
}) {
  const { data, isLoading, isError, error, refetch } = query;

  return (
    <Card className="border border-primary/10 p-5 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-text-dark">
            Synthèse revenus & volumes
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            <code className="rounded bg-white px-1 font-mono text-text-muted shadow-sm ring-1 ring-slate-900/[0.06]">
              GET /admin/revenue/summary
            </code>
          </p>
        </div>
        {isError ? (
          <button
            type="button"
            className="text-xs font-medium text-primary underline"
            onClick={() => void refetch()}
          >
            Réessayer
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <Skeleton className="mt-4 h-24 w-full rounded-input" />
      ) : null}

      {isError ? (
        <p className="mt-4 text-sm text-text-secondary">
          {getApiErrorMessage(error) ?? 'Impossible de charger la synthèse.'}
        </p>
      ) : null}

      {data ? (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-input border border-primary/10 bg-white px-3 py-2 shadow-sm">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
              Période
            </dt>
            <dd className="mt-0.5 font-medium text-text-dark">{data.period}</dd>
          </div>
          <div className="rounded-input border border-primary/10 bg-white px-3 py-2 shadow-sm">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
              Transactions
            </dt>
            <dd className="mt-0.5 font-medium text-text-dark">{data.transactionCount}</dd>
          </div>
          <div className="rounded-input border border-primary/10 bg-white px-3 py-2 shadow-sm">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
              Volume total (CFA)
            </dt>
            <dd className="mt-0.5 font-medium text-text-dark">
              {formatCFA(data.totalVolumeCfa)}
            </dd>
          </div>
          <div className="rounded-input border border-primary/10 bg-white px-3 py-2 shadow-sm">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
              Commissions (CFA)
            </dt>
            <dd className="mt-0.5 font-medium text-accent">
              {formatCFA(data.totalCommissionCfa)}
            </dd>
          </div>
          <div className="rounded-input border border-primary/10 bg-white px-3 py-2 shadow-sm">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
              Transferts en attente
            </dt>
            <dd className="mt-0.5 font-medium text-text-dark">{data.pendingTransfers}</dd>
          </div>
          <div className="rounded-input border border-primary/10 bg-white px-3 py-2 shadow-sm">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
              Montant en attente
            </dt>
            <dd className="mt-0.5 font-medium text-text-dark">
              {formatCFA(data.pendingAmount)}
            </dd>
          </div>
        </dl>
      ) : null}
    </Card>
  );
}
