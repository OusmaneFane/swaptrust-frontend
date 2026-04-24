"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { adminApi } from "@/services/api";
import { getApiErrorMessage } from "@/lib/api-error-message";

const schema = z.object({
  percent: z
    .number()
    .min(0, "Minimum 0%")
    .max(100, "Maximum 100%")
    .finite("Valeur invalide"),
});

type FormValues = z.infer<typeof schema>;

const promoSchema = z.object({
  percent: z
    .number()
    .min(0, "Minimum 0%")
    .max(100, "Maximum 100%")
    .finite("Valeur invalide"),
  startsAtLocal: z.string().optional(),
  endsAtLocal: z.string().min(1, "Date de fin requise"),
});

type PromoFormValues = z.infer<typeof promoSchema>;

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function localInputToIso(v: string): string | null {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function formatFr(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR");
}

export default function AdminCommissionPage() {
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "settings", "commission"],
    queryFn: () => adminApi.getCommissionSetting(),
  });

  const configQuery = useQuery({
    queryKey: ["admin", "settings", "commission", "config"],
    queryFn: () => adminApi.getCommissionConfig(),
  });

  const activePromosQuery = useQuery({
    queryKey: ["admin", "settings", "commission", "promo", "onlyActive"],
    queryFn: () => adminApi.listCommissionPromos(true),
  });

  const promosQuery = useQuery({
    queryKey: ["admin", "settings", "commission", "promo", "all"],
    queryFn: () => adminApi.listCommissionPromos(),
  });

  const defaultValues = useMemo<FormValues>(
    () => ({ percent: Number(data?.percent ?? 0) }),
    [data?.percent],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: defaultValues,
    mode: "onChange",
  });

  const promoDefaultValues = useMemo<PromoFormValues>(() => {
    const ends =
      configQuery.data?.commissionPromoEndsAt != null
        ? toLocalInputValue(configQuery.data.commissionPromoEndsAt)
        : "";
    return {
      percent: Number(configQuery.data?.commissionPromoPercent ?? 0),
      startsAtLocal: undefined,
      endsAtLocal: ends,
    };
  }, [
    configQuery.data?.commissionPromoEndsAt,
    configQuery.data?.commissionPromoPercent,
  ]);

  const promoForm = useForm<PromoFormValues>({
    resolver: zodResolver(promoSchema),
    values: promoDefaultValues,
    mode: "onChange",
  });

  const save = useMutation({
    mutationFn: async (percent: number) =>
      adminApi.updateCommissionSetting(percent),
    onSuccess: async (next) => {
      await qc.setQueryData(["admin", "settings", "commission"], next);
      toast.success(`Commission mise à jour : ${next.percent}%`);
      qc.invalidateQueries({
        queryKey: ["admin", "settings", "commission", "config"],
      });
      qc.invalidateQueries({ queryKey: ["settings", "public"] });
    },
    onError: (err: unknown) => {
      const apiMsg = getApiErrorMessage(err);
      toast.error(apiMsg ?? "Mise à jour impossible");
    },
  });

  const createPromo = useMutation({
    mutationFn: async (v: PromoFormValues) => {
      const endsAt = localInputToIso(v.endsAtLocal);
      if (!endsAt) throw new Error("Date de fin invalide");
      const startsAt = v.startsAtLocal
        ? localInputToIso(v.startsAtLocal)
        : null;
      if (v.startsAtLocal && !startsAt)
        throw new Error("Date de début invalide");
      return adminApi.createCommissionPromo({
        percent: v.percent,
        endsAt,
        ...(startsAt ? { startsAt } : {}),
      });
    },
    onSuccess: async () => {
      toast.success("Promo commission créée.");
      await qc.invalidateQueries({
        queryKey: ["admin", "settings", "commission", "config"],
      });
      await qc.invalidateQueries({
        queryKey: ["admin", "settings", "commission", "promo", "onlyActive"],
      });
      await qc.invalidateQueries({
        queryKey: ["admin", "settings", "commission", "promo", "all"],
      });
      await qc.invalidateQueries({ queryKey: ["settings", "public"] });
    },
    onError: (err: unknown) => {
      const apiMsg = getApiErrorMessage(err);
      toast.error(apiMsg ?? "Création impossible");
    },
  });

  const disablePromo = useMutation({
    mutationFn: async (id: number) => adminApi.deleteCommissionPromo(id),
    onSuccess: async () => {
      toast.success("Promo désactivée.");
      await qc.invalidateQueries({
        queryKey: ["admin", "settings", "commission", "config"],
      });
      await qc.invalidateQueries({
        queryKey: ["admin", "settings", "commission", "promo", "onlyActive"],
      });
      await qc.invalidateQueries({
        queryKey: ["admin", "settings", "commission", "promo", "all"],
      });
      await qc.invalidateQueries({ queryKey: ["settings", "public"] });
    },
    onError: (err: unknown) => {
      const apiMsg = getApiErrorMessage(err);
      toast.error(apiMsg ?? "Désactivation impossible");
    },
  });

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-56 w-full max-w-2xl rounded-card" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="max-w-2xl space-y-3 border border-primary/10 p-6 shadow-lg">
        <h1 className="font-display text-2xl font-bold text-text-dark">
          Commission
        </h1>
        <p className="text-sm text-danger">
          Impossible de charger la commission actuelle.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            qc.invalidateQueries({
              queryKey: ["admin", "settings", "commission"],
            })
          }
        >
          Réessayer
        </Button>
      </Card>
    );
  }

  const current = Number(data?.percent ?? 0);
  const watched = form.watch("percent");
  const dirty = watched !== current;

  const cfg = configQuery.data;
  const promo = activePromosQuery.data?.[0] ?? null;
  const promoActive = cfg?.isCommissionPromoActive === true;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-text-dark">
          Commission
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
          Cette valeur est appliquée aux demandes (montant envoyé = montant net
          + commission) et peut être modifiée sans redéploiement via{" "}
          <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-text-muted shadow-sm ring-1 ring-slate-900/[0.06]">
            PUT /admin/settings/commission
          </code>
          .
        </p>
      </div>

      <Card className="max-w-2xl space-y-5 border border-primary/10 p-6 shadow-lg">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Commission actuelle
            </p>
            <p className="mt-1 font-display text-3xl font-bold text-text-dark">
              {current}%
            </p>
          </div>
          <div className="rounded-card border border-primary/10 bg-white px-4 py-3 text-sm shadow-sm">
            <p className="font-semibold text-text-dark">Impact</p>
            <p className="mt-1 text-text-secondary">
              Commission{" "}
              <span className="font-semibold text-text-dark">{watched}%</span> sur le
              montant net.
            </p>
          </div>
        </div>

        <form
          onSubmit={form.handleSubmit((v) => save.mutate(v.percent))}
          className="space-y-4"
        >
          <Input
            variant="dark"
            label="Pourcentage"
            type="number"
            step="0.01"
            min={0}
            max={100}
            error={form.formState.errors.percent?.message}
            {...form.register("percent", { valueAsNumber: true })}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-dark">
              Ajuster rapidement
            </label>
            <input
              type="range"
              min={0}
              max={20}
              step={0.25}
              value={Number.isFinite(watched) ? watched : 0}
              onChange={(e) =>
                form.setValue("percent", Number(e.target.value), {
                  shouldValidate: true,
                })
              }
              className="w-full accent-primary"
            />
            <p className="text-xs text-text-muted">
              Plage rapide 0–20% (tu peux saisir jusqu’à 100% au champ).
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={!dirty || save.isPending}
              onClick={() => form.reset({ percent: current })}
            >
              Annuler
            </Button>
            <Button type="submit" loading={save.isPending} disabled={!dirty}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Card>

      <Card className="max-w-2xl space-y-5 border border-primary/10 p-6 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-text-dark">
              Promo commission
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-text-muted shadow-sm ring-1 ring-slate-900/[0.06]">
                GET /admin/settings/commission/config
              </code>
              <span className="mx-1.5 text-slate-300">·</span>
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-text-muted shadow-sm ring-1 ring-slate-900/[0.06]">
                POST /admin/settings/commission/promo
              </code>
              <span className="mx-1.5 text-slate-300">·</span>
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-text-muted shadow-sm ring-1 ring-slate-900/[0.06]">
                DELETE /admin/settings/commission/promo/:id
              </code>
            </p>
          </div>
          {configQuery.isError ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void configQuery.refetch()}
            >
              Réessayer
            </Button>
          ) : null}
        </div>

        {configQuery.isLoading && !cfg ? (
          <Skeleton className="h-40 w-full rounded-card" />
        ) : null}

        {configQuery.isError ? (
          <p className="text-sm text-danger">
            {getApiErrorMessage(configQuery.error) ??
              "Impossible de charger la config promo."}
          </p>
        ) : null}

        {cfg ? (
          <div className="grid gap-3 rounded-card border border-primary/10 bg-white p-4 text-sm shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-text-secondary">Base</span>
              <strong className="text-text-dark">{cfg.commissionBasePercent}%</strong>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-text-secondary">Promo</span>
              <strong className="text-text-dark">
                {cfg.commissionPromoPercent == null
                  ? "—"
                  : `${cfg.commissionPromoPercent}%`}
              </strong>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-text-secondary">Effective</span>
              <strong className="text-text-dark">{cfg.commissionPercent}%</strong>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-text-secondary">Promo active</span>
              <strong className={promoActive ? "text-success" : "text-text-dark"}>
                {promoActive ? "Oui" : "Non"}
              </strong>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-text-secondary">Fin promo</span>
              <strong className="text-text-dark">
                {formatFr(cfg.commissionPromoEndsAt)}
              </strong>
            </div>
          </div>
        ) : null}

        {promo ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-primary/10 bg-white p-4 text-sm shadow-sm">
            <div className="space-y-1">
              <p className="font-semibold text-text-dark">
                Promo #{promo.id} — {promo.percent}%
              </p>
              <p className="text-xs text-text-muted">
                Début: {formatFr(promo.startsAt)} · Fin:{" "}
                {formatFr(promo.endsAt)} · isActive: {String(promo.isActive)}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              loading={disablePromo.isPending}
              onClick={() => disablePromo.mutate(promo.id)}
            >
              Désactiver
            </Button>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            Aucune promo enregistrée.
          </p>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-text-dark">Toutes les promos</p>
            {promosQuery.isError ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void promosQuery.refetch()}
              >
                Réessayer
              </Button>
            ) : null}
          </div>

          {promosQuery.isLoading ? (
            <Skeleton className="h-24 w-full rounded-card" />
          ) : null}

          {promosQuery.isError ? (
            <p className="text-sm text-danger">
              {getApiErrorMessage(promosQuery.error) ??
                "Impossible de charger les promos."}
            </p>
          ) : null}

          {promosQuery.data && promosQuery.data.length > 0 ? (
            <div className="divide-y divide-primary/10 overflow-hidden rounded-card border border-primary/10 bg-white shadow-sm">
              {promosQuery.data.map((p) => {
                const inWindow = p.isCurrentlyInWindow === true;
                return (
                  <div
                    key={p.id}
                    className="flex flex-col gap-3 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-text-dark">
                        #{p.id} — {p.percent}%
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        Début: {formatFr(p.startsAt)} · Fin: {formatFr(p.endsAt)}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        Actif: {String(p.isActive)} · Dans fenêtre:{" "}
                        {String(inWindow)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {inWindow ? (
                        <span className="rounded-pill border border-success/25 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                          En cours
                        </span>
                      ) : (
                        <span className="rounded-pill border border-primary/10 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
                          Pas en cours
                        </span>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        loading={disablePromo.isPending}
                        disabled={!p.isActive}
                        onClick={() => disablePromo.mutate(p.id)}
                      >
                        Désactiver
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">
              Aucune promo enregistrée.
            </p>
          )}
        </div>

        <form
          onSubmit={promoForm.handleSubmit((v) => createPromo.mutate(v))}
          className="space-y-4"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              variant="dark"
              label="Pourcentage promo"
              type="number"
              step="0.01"
              min={0}
              max={100}
              error={promoForm.formState.errors.percent?.message}
              {...promoForm.register("percent", { valueAsNumber: true })}
            />
            <Input
              variant="dark"
              label="Début (optionnel)"
              type="datetime-local"
              error={promoForm.formState.errors.startsAtLocal?.message}
              {...promoForm.register("startsAtLocal")}
            />
            <Input
              variant="dark"
              label="Fin"
              type="datetime-local"
              error={promoForm.formState.errors.endsAtLocal?.message}
              {...promoForm.register("endsAtLocal")}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => promoForm.reset(promoDefaultValues)}
              disabled={createPromo.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" loading={createPromo.isPending}>
              Créer la promo
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
