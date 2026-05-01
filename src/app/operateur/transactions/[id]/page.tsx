"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Ban,
  Clipboard,
  Coins,
  MessageCircle,
  Receipt,
  Send,
  UserRound,
} from "lucide-react";
import { operatorApi } from "@/services/api";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProofViewer } from "@/components/shared/ProofViewer";
import { formatCFA, formatRUB, fullDate } from "@/lib/utils";
import { isRubPaymentRail } from "@/lib/transaction-display";
import { TRANSACTION_STEPS } from "@/types/transaction";
import type { OperatorLog, OperatorLogAction } from "@/types";
import { PAYMENT_METHOD_LABELS } from "@/constants/payment-methods";

const ACTION_LABEL: Record<OperatorLogAction, string> = {
  TAKEN: "Pris en charge",
  CLIENT_PROOF_VIEWED: "Reçu client consulté",
  OPERATOR_SENT: "Envoi opérateur",
  COMPLETED: "Clôturé",
  NOTE: "Note",
};

const ORDERED_STEPS = Object.values(TRANSACTION_STEPS)
  .slice()
  .sort((a, b) => a.step - b.step)
  .filter((s) => s.step >= 0 && s.step <= 4);

function StatusBadge({ label, status }: { label: string; status: string }) {
  const tone: "success" | "warning" | "danger" | "muted" =
    status === "COMPLETED"
      ? "success"
      : status === "DISPUTED"
        ? "warning"
        : status === "CANCELLED"
          ? "danger"
          : "muted";
  return (
    <Badge tone={tone} className="shadow-sm">
      {label}
    </Badge>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: "indigo" | "emerald" | "rose" | "amber";
  icon: ReactNode;
}) {
  const toneWrap =
    tone === "indigo"
      ? "bg-gradient-to-br from-indigo-500/[0.16] via-white to-white"
      : tone === "emerald"
        ? "bg-gradient-to-br from-emerald-500/[0.16] via-white to-white"
        : tone === "rose"
          ? "bg-gradient-to-br from-rose-500/[0.14] via-white to-white"
          : "bg-gradient-to-br from-amber-500/[0.16] via-white to-white";

  const toneIcon =
    tone === "indigo"
      ? "bg-indigo-500/[0.12] text-indigo-700 ring-indigo-500/15"
      : tone === "emerald"
        ? "bg-emerald-500/[0.12] text-emerald-700 ring-emerald-500/15"
        : tone === "rose"
          ? "bg-rose-500/[0.12] text-rose-700 ring-rose-500/15"
          : "bg-amber-500/[0.14] text-amber-800 ring-amber-500/15";

  return (
    <div
      className={`group relative overflow-hidden rounded-card border border-primary/10 p-4 shadow-sm transition hover:shadow-lg ${toneWrap}`}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/[0.06] blur-2xl transition group-hover:bg-primary/[0.09]" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {label}
          </p>
          <p className="mt-1 truncate font-display text-xl font-bold text-text-dark sm:text-2xl">
            {value}
          </p>
          {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
        </div>
        <span
          className={`grid h-10 w-10 place-items-center rounded-2xl ring-1 shadow-sm ${toneIcon}`}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}

export default function OperateurTransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const idParam = params?.id;
  const id = Number(Array.isArray(idParam) ? idParam[0] : idParam);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const {
    data: tx,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["operator", "transaction", id],
    queryFn: () => operatorApi.getTransactionDetail(id),
    enabled: Number.isFinite(id),
    refetchInterval: 10_000,
  });

  const verifyMut = useMutation({
    mutationFn: () => operatorApi.verifyClientProof(id),
    onSuccess: () => {
      toast.success("Reçu validé");
      void qc.invalidateQueries({ queryKey: ["operator", "transaction", id] });
    },
    onError: () => toast.error("Action impossible"),
  });

  const sendMut = useMutation({
    mutationFn: (file: File) => operatorApi.operatorSend(id, file),
    onSuccess: () => {
      toast.success("Reçu envoyé — en attente du client");
      setProofFile(null);
      void qc.invalidateQueries({ queryKey: ["operator", "transaction", id] });
      void qc.invalidateQueries({ queryKey: ["operator", "transactions"] });
    },
    onError: () => toast.error("Envoi impossible"),
  });

  const addNote = useMutation({
    mutationFn: (note: string) => operatorApi.addNote(id, note),
    onSuccess: () => {
      toast.success("Note enregistrée");
      void qc.invalidateQueries({ queryKey: ["operator", "transaction", id] });
    },
    onError: () => toast.error("Impossible d’ajouter la note"),
  });

  const cancelMut = useMutation({
    mutationFn: (reason: string) => operatorApi.cancel(id, reason),
    onSuccess: () => {
      toast.success("Transaction annulée");
      void qc.invalidateQueries({ queryKey: ["operator"] });
      router.push("/operateur");
    },
    onError: () => toast.error("Annulation impossible"),
  });

  if (!Number.isFinite(id)) {
    return <p className="text-sm text-text-muted">Transaction invalide.</p>;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  if (isError || !tx) {
    return (
      <div className="text-center">
        <p className="text-sm text-text-muted">Transaction introuvable.</p>
        <Link
          href="/operateur/transactions"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          ← Retour
        </Link>
      </div>
    );
  }

  const meta = TRANSACTION_STEPS[tx.status];
  const req = tx.request;
  const commissionRaw = (tx as { commissionAmount?: unknown }).commissionAmount;
  const commissionMinor =
    typeof commissionRaw === "number"
      ? commissionRaw
      : Number(commissionRaw ?? 0) || 0;
  const commissionIsRub = isRubPaymentRail(tx.paymentMethod);
  const amountRubMinor = Number((tx as { amountRub?: unknown }).amountRub ?? 0) || 0;
  const rateRubPerCfa = Number((tx as { rate?: unknown }).rate ?? 0) || 0;
  const commissionCfaApproxMinor =
    commissionIsRub && rateRubPerCfa > 0
      ? Math.round(commissionMinor / rateRubPerCfa)
      : null;
  const netSendMinor =
    commissionIsRub
      ? Math.max(0, amountRubMinor - commissionMinor)
      : null;
  const statusLabel = meta?.label ?? tx.status;
  const statusDescription = meta?.description ?? "";
  const stepIndex = meta?.step ?? 0;

  function onAddNote() {
    const note = window.prompt("Note interne :") ?? "";
    if (note.trim()) addNote.mutate(note.trim());
  }

  function onCancel() {
    const reason = window.prompt("Motif d’annulation :") ?? "";
    if (reason.trim()) cancelMut.mutate(reason.trim());
  }

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border border-primary/10 bg-gradient-to-br from-primary/[0.10] via-white to-white p-6 shadow-lg">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/[0.18] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/[0.16] blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              href="/operateur/transactions"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Mes transactions
            </Link>
            <h1 className="mt-3 font-display text-2xl font-bold text-text-dark md:text-3xl">
              Transaction <span className="text-primary">#{tx.id}</span>
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              {tx.takenAt ? `Prise en charge ${fullDate(tx.takenAt)}` : "—"}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge label={statusLabel} status={tx.status} />
              <span className="rounded-pill border border-primary/10 bg-white px-2.5 py-0.5 text-xs font-semibold text-text-muted shadow-sm">
                {tx.status}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/transactions/${id}/chat`}
              className="inline-flex items-center gap-2 rounded-pill border border-primary/15 bg-white px-4 py-2 text-sm font-semibold text-text-dark shadow-sm transition hover:bg-primary/[0.04]"
            >
              <MessageCircle className="h-4 w-4 text-primary" />
              Chat client
            </Link>

            {tx.status !== "COMPLETED" && tx.status !== "CANCELLED" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-pill"
                  loading={addNote.isPending}
                  onClick={onAddNote}
                >
                  <Clipboard className="mr-2 h-4 w-4" />
                  Ajouter une note
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-pill text-danger"
                  loading={cancelMut.isPending}
                  onClick={onCancel}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Annuler
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <div className="relative mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Montant (CFA)"
            value={formatCFA(tx.amountCfa)}
            hint={req ? PAYMENT_METHOD_LABELS[req.paymentMethod] : undefined}
            tone="emerald"
            icon={<TrendingUpIcon />}
          />
          <StatCard
            label="Montant (RUB)"
            value={formatRUB(tx.amountRub)}
            tone="indigo"
            icon={<Coins className="h-5 w-5" />}
          />
          <StatCard
            label={commissionIsRub ? "Commission (RUB)" : "Commission (CFA)"}
            value={commissionIsRub ? formatRUB(commissionMinor) : formatCFA(commissionMinor)}
            hint={
              commissionIsRub && commissionCfaApproxMinor != null
                ? `≈ ${formatCFA(commissionCfaApproxMinor)} (réf. API)`
                : undefined
            }
            tone="rose"
            icon={<Receipt className="h-5 w-5" />}
          />
          <StatCard
            label={commissionIsRub ? "Net (RUB)" : "Net (CFA)"}
            value={
              commissionIsRub
                ? formatRUB(netSendMinor ?? 0)
                : formatCFA(
                    Math.max(
                      0,
                      (Number(tx.amountCfa ?? 0) || 0) - commissionMinor,
                    ),
                  )
            }
            hint={commissionIsRub ? "Total − Commission" : "Volume − Commission"}
            tone="amber"
            icon={<BadgeCheck className="h-5 w-5" />}
          />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="border border-primary/10 p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-text-dark">
                  Progression
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  {statusDescription}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-pill border border-primary/10 bg-white px-3 py-1 text-xs font-semibold text-text-muted shadow-sm">
                Étape {Math.max(0, stepIndex)} / 4
              </div>
            </div>

            <ol className="mt-5 grid gap-2 sm:grid-cols-2">
              {ORDERED_STEPS.map((s) => {
                const done = s.step <= stepIndex;
                return (
                  <li
                    key={s.step}
                    className={`relative rounded-card border p-4 shadow-sm ${
                      done
                        ? "border-primary/15 bg-primary/[0.04]"
                        : "border-primary/10 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 grid h-8 w-8 place-items-center rounded-2xl ring-1 shadow-sm ${
                          done
                            ? "bg-emerald-500/[0.12] text-emerald-700 ring-emerald-500/15"
                            : "bg-primary/[0.06] text-primary ring-primary/15"
                        }`}
                      >
                        {done ? (
                          <BadgeCheck className="h-4 w-4" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-dark">
                          {s.label}
                        </p>
                        <p className="mt-1 text-xs text-text-muted">
                          {s.description}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="space-y-3 border border-primary/10 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Client
                </p>
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/[0.06] text-primary ring-1 ring-primary/15">
                  <UserRound className="h-4 w-4" />
                </span>
              </div>
              <p className="font-semibold text-text-dark">{tx.client.name}</p>
              <p className="text-sm text-text-secondary">
                Réception : {tx.clientReceiveNumber ?? req?.phoneToSend ?? "—"}
              </p>
              {req ? (
                <p className="text-xs text-text-muted">
                  Demande #{req.id} · {PAYMENT_METHOD_LABELS[req.paymentMethod]}
                </p>
              ) : null}
            </Card>

            <Card className="space-y-3 border border-primary/10 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Vous
                </p>
                <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/[0.06] text-primary ring-1 ring-primary/15">
                  <Send className="h-4 w-4" />
                </span>
              </div>
              <p className="font-semibold text-text-dark">{tx.operator.name}</p>
              <p className="text-sm text-text-secondary">
                Numéro communiqué :
                <span className="ml-2 font-mono font-semibold text-text-dark">
                  {tx.operatorPaymentNumber ?? "—"}
                </span>
              </p>
              {tx.operatorNote ? (
                <p className="text-xs text-text-muted">
                  Note : {tx.operatorNote}
                </p>
              ) : null}
            </Card>
          </div>

          {tx.clientProofUrl ? (
            <Card className="border border-primary/10 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold text-text-dark">
                    Reçu du client
                  </h2>
                  {tx.clientSentAt ? (
                    <p className="mt-1 text-xs text-text-muted">
                      Reçu signalé {fullDate(tx.clientSentAt)}
                    </p>
                  ) : null}
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/[0.12] text-emerald-700 ring-1 ring-emerald-500/15 shadow-sm">
                  <Receipt className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4">
                <ProofViewer url={tx.clientProofUrl} label="Reçu client" />
              </div>
            </Card>
          ) : null}

          {tx.operatorProofUrl ? (
            <Card className="border border-primary/10 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold text-text-dark">
                    Votre preuve d’envoi
                  </h2>
                  <p className="mt-1 text-xs text-text-muted">
                    Archive de votre capture / reçu d’envoi.
                  </p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-500/[0.12] text-indigo-700 ring-1 ring-indigo-500/15 shadow-sm">
                  <Send className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4">
                <ProofViewer url={tx.operatorProofUrl} label="Votre reçu" />
              </div>
            </Card>
          ) : null}

          {tx.platformToOperatorProofUrl ? (
            <Card className="border border-primary/10 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold text-text-dark">
                    Transfert plateforme → opérateur
                  </h2>
                  <p className="mt-1 text-xs text-text-muted">
                    {tx.platformTransferredAt
                      ? `Effectué ${fullDate(tx.platformTransferredAt)}`
                      : "Preuve disponible."}
                  </p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/[0.12] text-emerald-700 ring-1 ring-emerald-500/15 shadow-sm">
                  <Receipt className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4">
                <ProofViewer
                  url={tx.platformToOperatorProofUrl}
                  label="Preuve transfert plateforme"
                />
              </div>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          {tx.status === "CLIENT_SENT" ? (
            <Card className="relative overflow-hidden border border-primary/10 bg-gradient-to-br from-emerald-500/[0.14] via-white to-white p-5 shadow-sm">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/[0.18] blur-2xl" />
              <div className="relative">
                <h2 className="font-semibold text-text-dark">Action requise</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Vérifiez le reçu client avant de préparer l’envoi.
                </p>
                <Button
                  type="button"
                  className="mt-4 w-full"
                  loading={verifyMut.isPending}
                  onClick={() => verifyMut.mutate()}
                >
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  J’ai vérifié le reçu client
                </Button>
              </div>
            </Card>
          ) : null}

          {tx.status === "OPERATOR_VERIFIED" ? (
            <Card className="relative overflow-hidden border border-primary/10 bg-gradient-to-br from-indigo-500/[0.14] via-white to-white p-5 shadow-sm">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-500/[0.18] blur-2xl" />
              <div className="relative space-y-3">
                <h2 className="font-semibold text-text-dark">
                  Envoi au client
                </h2>
                <p className="text-sm text-text-secondary">
                  Envoyez les fonds puis joignez la capture de votre preuve
                  d’envoi.
                </p>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-dark">
                    Preuve de votre envoi (image ou PDF)
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="w-full rounded-input border border-primary/10 bg-white px-3 py-2 text-sm text-text-secondary shadow-sm"
                    onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                  />
                  <Button
                    type="button"
                    className="w-full"
                    disabled={!proofFile || sendMut.isPending}
                    loading={sendMut.isPending}
                    onClick={() => proofFile && sendMut.mutate(proofFile)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Confirmer l’envoi + preuve
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}

          <Card className="border border-primary/10 p-5 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-text-dark">
              Journal
            </h2>
            <ul className="mt-4 space-y-2 border-l-2 border-primary/15 pl-4">
              {(tx.operatorLogs ?? []).length ? (
                tx.operatorLogs.map((log: OperatorLog) => (
                  <li key={log.id} className="text-sm">
                    <span className="text-text-muted">
                      {fullDate(log.createdAt)}
                    </span>{" "}
                    <span className="font-semibold text-primary">
                      {ACTION_LABEL[log.action]}
                    </span>
                    {log.note ? (
                      <span className="text-text-secondary"> — {log.note}</span>
                    ) : null}
                  </li>
                ))
              ) : (
                <li className="text-sm text-text-muted">Aucune entrée.</li>
              )}
            </ul>
          </Card>

          <Card className="border border-primary/10 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-text-dark">Raccourcis</p>
            <div className="mt-3 grid gap-2">
              <Link
                href={`/transactions/${id}/chat`}
                className="flex items-center justify-between rounded-card border border-primary/10 bg-white p-3 text-sm font-semibold text-primary shadow-sm transition hover:border-primary/25 hover:bg-primary/[0.04]"
              >
                <span className="inline-flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Ouvrir le chat
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/operateur/transactions"
                className="flex items-center justify-between rounded-card border border-primary/10 bg-white p-3 text-sm font-semibold text-text-dark shadow-sm transition hover:border-primary/25 hover:bg-primary/[0.04]"
              >
                <span className="inline-flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4 text-primary" />
                  Retour à la liste
                </span>
                <ArrowRight className="h-4 w-4 text-text-muted" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TrendingUpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 17l6-6 4 4 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 8h6v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
