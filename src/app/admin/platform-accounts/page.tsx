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
import { formatAccountForDisplay } from '@/lib/swaptrust-receive';
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
    queryKey: ['admin', 'revenue-summary'],
    queryFn: () => adminApi.revenueSummary(),
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
          <p className="text-xs text-ink-muted">
            <Link href="/admin" className="text-primary hover:underline">
              ← Tableau de bord
            </Link>
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
            Comptes SwapTrust
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-secondary">
            Réception centralisée des paiements clients avant transfert net aux opérateurs. Gestion
            via{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
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

      {isLoading ? <Skeleton className="h-52 w-full rounded-card" /> : null}

      {isError ? (
        <Card className="border-warning/30 bg-warning/10 p-4 text-sm text-ink-secondary">
          <p className="font-medium text-ink">Chargement de la liste impossible</p>
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
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-sm text-ink-muted">Aucun compte enregistré.</p>
          <Button type="button" className="gap-2" onClick={() => openCreate()}>
            <Plus className="h-4 w-4" aria-hidden />
            Créer le premier compte
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError && data && data.length > 0 ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line bg-muted/30 text-xs uppercase tracking-wide text-ink-muted">
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
                <tr key={row.id} className="border-b border-line/80 last:border-0">
                  <td className="p-4 font-medium text-ink">
                    {PAYMENT_METHOD_LABELS[row.method] ?? row.method}
                  </td>
                  <td className="p-4 font-mono text-xs text-ink-secondary">
                    {formatAccountForDisplay(row.accountNumber)}
                  </td>
                  <td className="p-4 text-ink-secondary">{row.accountName}</td>
                  <td className="p-4">
                    <span
                      className={
                        row.isActive
                          ? 'rounded-pill bg-success/15 px-2 py-0.5 text-xs font-medium text-success'
                          : 'rounded-pill bg-muted px-2 py-0.5 text-xs font-medium text-ink-muted'
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
            <p className="text-xs text-ink-muted">
              Méthode :{' '}
              <strong className="text-ink">
                {PAYMENT_METHOD_LABELS[dialog.row.method]}
              </strong>{' '}
              (non modifiable ici — créez un autre compte si besoin.)
            </p>
          ) : (
            <div>
              <label className="mb-2 block text-sm text-ink-secondary">Méthode</label>
              <select
                className="input-field w-full"
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
            label="Numéro ou IBAN"
            placeholder="+22370000000 ou ML00…"
            value={form.accountNumber}
            onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
          />
          <Input
            label="Nom affiché (client)"
            placeholder="SwapTrust — Orange Money"
            value={form.accountName}
            onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-secondary">
            <input
              type="checkbox"
              className="rounded border-line text-primary focus:ring-primary"
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
    <Card className="border-primary/15 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            Synthèse revenus & volumes
          </h2>
          <p className="mt-1 text-xs text-ink-muted">
            <code className="rounded bg-muted px-1 font-mono">GET /admin/revenue/summary</code>
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
        <p className="mt-4 text-sm text-ink-secondary">
          {getApiErrorMessage(error) ?? 'Impossible de charger la synthèse.'}
        </p>
      ) : null}

      {data ? (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-input border border-line bg-surface/50 px-3 py-2">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
              Période
            </dt>
            <dd className="mt-0.5 font-medium text-ink">{data.period}</dd>
          </div>
          <div className="rounded-input border border-line bg-surface/50 px-3 py-2">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
              Transactions
            </dt>
            <dd className="mt-0.5 font-medium text-ink">{data.transactionCount}</dd>
          </div>
          <div className="rounded-input border border-line bg-surface/50 px-3 py-2">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
              Volume total (CFA)
            </dt>
            <dd className="mt-0.5 font-medium text-ink">{formatCFA(data.totalVolumeCfa)}</dd>
          </div>
          <div className="rounded-input border border-line bg-surface/50 px-3 py-2">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
              Commissions (CFA)
            </dt>
            <dd className="mt-0.5 font-medium text-accent">
              {formatCFA(data.totalCommissionCfa)}
            </dd>
          </div>
          <div className="rounded-input border border-line bg-surface/50 px-3 py-2">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
              Transferts en attente
            </dt>
            <dd className="mt-0.5 font-medium text-ink">{data.pendingTransfers}</dd>
          </div>
          <div className="rounded-input border border-line bg-surface/50 px-3 py-2">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
              Montant en attente
            </dt>
            <dd className="mt-0.5 font-medium text-ink">{formatCFA(data.pendingAmount)}</dd>
          </div>
        </dl>
      ) : null}
    </Card>
  );
}
