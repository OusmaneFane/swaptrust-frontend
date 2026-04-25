"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Coins,
  Copy,
  MessageCircle,
  Receipt,
  Star,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { TransactionTimeline } from "@/components/exchange/TransactionTimeline";
import { ClientSendButton } from "@/components/client/ClientSendButton";
import { ClientConfirmButton } from "@/components/client/ClientConfirmButton";
import { ProofViewer } from "@/components/shared/ProofViewer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { useTransaction } from "@/hooks/useTransaction";
import { resolveClientSendDestination } from "@/lib/resolve-client-send-destination";
import { formatAccountForDisplay } from "@/lib/donisend-receive";
import {
  formatGrossSendForClient,
  formatMinorForSendRail,
} from "@/lib/transaction-display";
import { cn, formatCFA, formatRUB, fullDate } from "@/lib/utils";
import { sameUserId } from "@/lib/same-user";
import { authApi, transactionsApi, reviewsApi } from "@/services/api";
import { toast } from "sonner";
import { showWhatsappToast } from "@/components/ui/WhatsappToast";
import { userWhatsappNotifyPhone } from "@/lib/user-phones";
import type { TransactionStatus } from "@/types";
import { TRANSACTION_STEPS } from "@/types/transaction";

function statusBadgeTone(
  s: TransactionStatus,
): "default" | "success" | "warning" | "danger" | "muted" {
  switch (s) {
    case "COMPLETED":
      return "success";
    case "CANCELLED":
    case "DISPUTED":
      return "danger";
    case "CLIENT_SENT":
    case "INITIATED":
      return "warning";
    default:
      return "default";
  }
}

function CopyableAccountValue({ raw }: { raw: string }) {
  const [copied, setCopied] = useState(false);
  const display = formatAccountForDisplay(raw);
  async function copy() {
    try {
      const compact = raw.replace(/\s/g, "");
      await navigator.clipboard.writeText(compact);
      setCopied(true);
      toast.success("Copié dans le presse-papiers");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie impossible");
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="break-all font-mono text-sm font-semibold text-text-dark sm:text-base">
        {display}
      </span>
      <button
        type="button"
        onClick={() => void copy()}
        className={cn(
          "rounded-xl border border-slate-200/90 bg-white p-2 text-primary shadow-sm ring-1 ring-slate-900/[0.04] transition",
          "hover:border-primary/25 hover:bg-primary/[0.04]",
        )}
        aria-label="Copier le numéro ou l’IBAN"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

function operatorShortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 1) + ".";
  return `${parts[0]!.charAt(0)}. ${parts[parts.length - 1]}`;
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const n = i + 1;
        const active = n <= value;
        return (
          <button
            key={n}
            type="button"
            className={cn(
              "grid h-10 w-10 place-items-center rounded-xl border transition",
              active
                ? "border-amber-300/70 bg-amber-50 text-amber-600"
                : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50",
            )}
            onClick={() => onChange(n)}
            aria-label={`Donner ${n} étoile${n > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                "h-5 w-5",
                active ? "fill-amber-400 text-amber-500" : "fill-transparent",
              )}
              strokeWidth={1.8}
              aria-hidden
            />
          </button>
        );
      })}
      <span className="ml-2 text-sm font-semibold text-text-dark">
        {value}/5
      </span>
    </div>
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
  icon: React.ReactNode;
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
      className={cn(
        surfaceCard,
        "group relative overflow-hidden p-4 shadow-none transition hover:shadow-lg",
        toneWrap,
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/[0.06] blur-2xl transition group-hover:bg-primary/[0.09]" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            {label}
          </p>
          <p className="mt-1 truncate font-display text-lg font-bold text-text-dark sm:text-xl">
            {value}
          </p>
          {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
        </div>
        <span
          className={cn(
            "grid h-10 w-10 place-items-center rounded-2xl ring-1 shadow-sm",
            toneIcon,
          )}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}

const shell = "relative mx-auto min-w-0 max-w-lg pb-10 pt-0 xl:max-w-2xl";
const halo =
  "pointer-events-none absolute inset-x-0 top-0 mx-auto h-[min(14rem,32vh)] max-w-xl rounded-[40%] bg-gradient-to-b from-primary/[0.14] via-violet-500/[0.05] to-transparent blur-3xl";

const surfaceCard =
  "rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm ring-1 ring-slate-900/[0.04] backdrop-blur-sm";

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id;
  const id = Number(Array.isArray(idParam) ? idParam[0] : idParam);
  const { data: session } = useSession();
  const { data: me } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me(),
  });
  const notifyPhone = userWhatsappNotifyPhone(me);
  const { data: tx, isLoading } = useTransaction(id);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const sessionId = session?.user?.id;
  const isClient =
    tx && sessionId != null && sameUserId(sessionId, tx.client.id);

  async function submitDispute() {
    try {
      await transactionsApi.dispute(id, {
        reason: disputeReason || "Problème signalé",
      });
      toast.success("Litige ouvert");
      setDisputeOpen(false);
      router.refresh();
    } catch {
      toast.error("Impossible d’ouvrir le litige");
    }
  }

  async function submitReview() {
    try {
      await reviewsApi.create(id, {
        rating,
        comment: reviewComment || undefined,
      });
      toast.success("Merci pour votre avis");
      setReviewOpen(false);
      setReviewDone(true);
    } catch (err: unknown) {
      const status = (() => {
        if (typeof err !== "object" || err === null) return undefined;
        const response = (err as Record<string, unknown>).response;
        if (typeof response !== "object" || response === null) return undefined;
        const s = (response as Record<string, unknown>).status;
        return typeof s === "number" ? s : undefined;
      })();
      if (status === 409) {
        toast.message("Avis déjà envoyé");
        setReviewOpen(false);
        setReviewDone(true);
        return;
      }
      toast.error("Envoi de l’avis impossible");
    }
  }

  const showDispute =
    tx && tx.status !== "COMPLETED" && tx.status !== "CANCELLED";

  const reviewQuery = useQuery({
    queryKey: ["review", "transaction", id, tx?.operator?.id, me?.id],
    queryFn: async () => {
      if (!tx?.operator?.id || !me?.id) return null;
      const rows = await reviewsApi.getForUser(tx.operator.id);
      return (
        rows.find(
          (r) => r.transactionId === id && sameUserId(r.author.id, me.id),
        ) ?? null
      );
    },
    enabled: Boolean(tx && me && tx.status === "COMPLETED" && tx.operator?.id),
    staleTime: 30_000,
  });

  const hasReviewed = reviewDone || Boolean(reviewQuery.data);

  if (isLoading || !tx) {
    return (
      <div className={shell}>
        <div className={halo} aria-hidden />
        <div className="relative space-y-3">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className={shell}>
        <div className={halo} aria-hidden />
        <div className={cn(surfaceCard, "relative space-y-4 p-8 text-center")}>
          <p className="text-sm font-medium text-text-dark">
            Accès réservé au client de la transaction.
          </p>
          <Link
            href="/transactions"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/[0.1]"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l’historique
          </Link>
        </div>
      </div>
    );
  }

  const donisendDestination = resolveClientSendDestination(tx);
  const stepMeta = TRANSACTION_STEPS[tx.status];

  return (
    <div className={shell}>
      <div className={halo} aria-hidden />
      <div className="relative space-y-4">
        <Card className="relative overflow-hidden border border-primary/10 bg-gradient-to-br from-primary/[0.10] via-white to-white p-5 shadow-lg sm:p-6">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/[0.18] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/[0.16] blur-3xl" />

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/transactions"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:underline"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
                Historique
              </Link>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
                  Transaction <span className="text-primary">#{tx.id}</span>
                </h1>
                <Badge
                  tone={statusBadgeTone(tx.status)}
                  className="text-[10px] shadow-sm"
                >
                  {stepMeta.label}
                </Badge>
              </div>

              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-secondary">
                <span className="inline-flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-2xl bg-primary/[0.06] text-primary ring-1 ring-primary/15">
                    <UserRound className="h-4 w-4" aria-hidden />
                  </span>
                  <span>
                    Opérateur :{" "}
                    <span className="font-semibold text-text-dark">
                      {operatorShortName(tx.operator.name)}
                    </span>
                  </span>
                </span>
                <span className="hidden text-slate-300 sm:inline" aria-hidden>
                  ·
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-amber-800/90">
                  <Star
                    className="h-4 w-4 fill-amber-400 text-amber-500"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  {tx.operator.ratingAvg != null
                    ? tx.operator.ratingAvg.toFixed(1)
                    : "—"}
                </span>
              </p>

              <p className="mt-2 text-sm text-text-muted">
                {stepMeta.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/transactions/${id}/chat`}
                className={cn(
                  "inline-flex shrink-0 items-center justify-center gap-2 rounded-pill border border-primary/15 bg-white px-4 py-2 text-sm font-semibold text-text-dark shadow-sm ring-1 ring-slate-900/[0.04] transition",
                  "hover:border-primary/30 hover:bg-primary/[0.04]",
                )}
              >
                <MessageCircle
                  className="h-4 w-4 text-primary"
                  strokeWidth={2}
                />
                Chat
              </Link>
            </div>
          </div>

          <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
            {tx.grossAmount != null && tx.netAmount != null ? (
              <>
                <StatCard
                  label="Montant (net)"
                  value={formatMinorForSendRail(tx, tx.netAmount)}
                  tone="emerald"
                  icon={<TrendingUp className="h-5 w-5" />}
                />
                <StatCard
                  label="Commission DoniSend"
                  value={formatMinorForSendRail(tx, tx.commissionAmount)}
                  tone="rose"
                  icon={<Receipt className="h-5 w-5" />}
                />
                <StatCard
                  label="Total à envoyer"
                  value={formatMinorForSendRail(tx, tx.grossAmount)}
                  hint="Total = net + commission"
                  tone="indigo"
                  icon={<Coins className="h-5 w-5" />}
                />
              </>
            ) : (
              <>
                <StatCard
                  label="Montant CFA"
                  value={formatCFA(tx.amountCfa)}
                  tone="emerald"
                  icon={<TrendingUp className="h-5 w-5" />}
                />
                <StatCard
                  label="Montant RUB"
                  value={formatRUB(tx.amountRub)}
                  tone="indigo"
                  icon={<Coins className="h-5 w-5" />}
                />
                <StatCard
                  label="Commission (réf.)"
                  value={
                    tx.commissionAmount > 0
                      ? formatMinorForSendRail(tx, tx.commissionAmount)
                      : "—"
                  }
                  tone="rose"
                  icon={<Receipt className="h-5 w-5" />}
                />
              </>
            )}
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className={cn(surfaceCard, "p-4")}>
              <TransactionTimeline status={tx.status} />
            </div>

            {tx.takenAt ||
            tx.clientSentAt ||
            tx.platformTransferredAt ||
            tx.operatorSentAt ||
            tx.completedAt ||
            tx.clientProofUrl ||
            tx.platformToOperatorProofUrl ||
            tx.operatorProofUrl ? (
              <div className={cn(surfaceCard, "p-4")}>
                <p className="text-sm font-bold text-text-dark">Historique</p>
                <div className="mt-3 space-y-4">
                  {tx.takenAt ? (
                    <div className="rounded-xl border border-slate-200/80 bg-white p-3 text-sm">
                      <p className="font-semibold text-text-dark">
                        Opérateur assigné
                      </p>
                      <p className="text-xs text-text-muted">
                        {fullDate(tx.takenAt)}
                      </p>
                    </div>
                  ) : null}

                  {tx.clientSentAt || tx.clientProofUrl ? (
                    <div className="rounded-xl border border-slate-200/80 bg-white p-3 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-text-dark">
                            Votre envoi (preuve)
                          </p>
                          <p className="text-xs text-text-muted">
                            {tx.clientSentAt ? fullDate(tx.clientSentAt) : "—"}
                          </p>
                        </div>
                      </div>
                      {tx.clientProofUrl ? (
                        <div className="mt-3">
                          <ProofViewer
                            url={tx.clientProofUrl}
                            label="Votre reçu"
                          />
                        </div>
                      ) : (
                        <p className="mt-3 rounded-xl border border-amber-200/60 bg-amber-50/60 p-3 text-xs text-amber-950/90">
                          Aucune preuve renvoyée par l’API pour l’instant.
                        </p>
                      )}
                    </div>
                  ) : null}

                  {tx.platformTransferredAt || tx.platformToOperatorProofUrl ? (
                    <div className="rounded-xl border border-slate-200/80 bg-white p-3 text-sm">
                      <p className="font-semibold text-text-dark">
                        Transfert plateforme → opérateur
                      </p>
                      <p className="text-xs text-text-muted">
                        {tx.platformTransferredAt
                          ? fullDate(tx.platformTransferredAt)
                          : "—"}
                      </p>
                      {tx.platformToOperatorProofUrl ? (
                        <p className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs text-text-muted">
                          Cette preuve est{" "}
                          <strong className="text-text-dark">réservée</strong> à
                          l’opérateur assigné et aux administrateurs.
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {tx.operatorSentAt || tx.operatorProofUrl ? (
                    <div className="rounded-xl border border-slate-200/80 bg-white p-3 text-sm">
                      <p className="font-semibold text-text-dark">
                        Envoi opérateur (preuve)
                      </p>
                      <p className="text-xs text-text-muted">
                        {tx.operatorSentAt ? fullDate(tx.operatorSentAt) : "—"}
                      </p>
                      {tx.operatorProofUrl ? (
                        <div className="mt-3">
                          <ProofViewer
                            url={tx.operatorProofUrl}
                            label="Reçu opérateur"
                          />
                        </div>
                      ) : (
                        <p className="mt-3 rounded-xl border border-amber-200/60 bg-amber-50/60 p-3 text-xs text-amber-950/90">
                          Aucune preuve renvoyée par l’API pour l’instant.
                        </p>
                      )}
                    </div>
                  ) : null}

                  {tx.completedAt ? (
                    <div className="rounded-xl border border-slate-200/80 bg-white p-3 text-sm">
                      <p className="font-semibold text-text-dark">
                        Transaction clôturée
                      </p>
                      <p className="text-xs text-text-muted">
                        {fullDate(tx.completedAt)}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {tx.status === "INITIATED" && donisendDestination ? (
              <Card
                className={cn(
                  surfaceCard,
                  "space-y-3 border-primary/15 bg-gradient-to-br from-white via-primary/[0.03] to-white p-4 shadow-none sm:p-5",
                )}
              >
                <p className="text-sm font-semibold text-text-dark">
                  Envoyez <span className="text-accent">exactement</span> sur ce
                  compte DoniSend
                </p>
                <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/[0.06] to-white p-4 shadow-sm ring-1 ring-primary/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Réception officielle
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-dark">
                    {donisendDestination.accountName}
                  </p>
                  <div className="mt-3">
                    <CopyableAccountValue
                      raw={donisendDestination.accountNumber}
                    />
                  </div>
                  <p className="mt-4 rounded-xl bg-slate-900/[0.04] px-3 py-2.5 text-center font-display text-base font-bold tabular-nums text-text-dark sm:text-lg">
                    Montant exact : {formatGrossSendForClient(tx)}
                  </p>
                </div>
                <div className="flex gap-2.5 rounded-xl border border-amber-200/60 bg-amber-50/80 p-3 text-xs leading-relaxed text-amber-950/90">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                    aria-hidden
                  />
                  <p>
                    N’envoyez <strong className="text-text-dark">pas</strong>{" "}
                    directement à l’opérateur : les fonds passent toujours par
                    DoniSend.
                  </p>
                </div>
              </Card>
            ) : null}

            {tx.status === "INITIATED" && !donisendDestination ? (
              <div
                className={cn(
                  surfaceCard,
                  "flex gap-3 border-amber-200/70 bg-amber-50/50 p-4 text-sm text-amber-950/90",
                )}
              >
                <AlertTriangle
                  className="h-5 w-5 shrink-0 text-amber-600"
                  aria-hidden
                />
                <div>
                  <p className="font-semibold text-text-dark">
                    Numéro DoniSend indisponible
                  </p>
                  <p className="mt-1 text-xs leading-relaxed">
                    Le compte de réception officiel n’est pas encore renvoyé par
                    l’API ou configuré (variables{" "}
                    <code className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-text-dark">
                      NEXT_PUBLIC_*
                    </code>{" "}
                    de réception). Contactez le support en indiquant la
                    transaction #{tx.id}.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Preuves : désormais gérées dans "Historique" (ci-dessus). */}
          </div>

          <div className="space-y-3">
            {tx.status === "INITIATED" ? (
              <ClientSendButton
                transactionId={id}
                onWhatsappNotify={() => {
                  if (notifyPhone) showWhatsappToast(notifyPhone);
                }}
              />
            ) : null}

            {tx.status === "CLIENT_SENT" ||
            tx.status === "OPERATOR_VERIFIED" ? (
              <div
                className={cn(
                  surfaceCard,
                  "flex gap-3 border-primary/15 bg-gradient-to-br from-white via-primary/[0.03] to-white p-4 text-sm",
                )}
              >
                <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-2xl bg-amber-500/[0.14] text-amber-800 ring-1 ring-amber-500/15">
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                </div>
                <div>
                  <p className="font-semibold text-text-dark">
                    En vérification
                  </p>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    L’opérateur vérifie votre reçu…
                  </p>
                </div>
              </div>
            ) : null}

            {tx.status === "OPERATOR_SENT" ? (
              <ClientConfirmButton
                transactionId={id}
                onWhatsappNotify={() => {
                  if (notifyPhone) showWhatsappToast(notifyPhone);
                }}
              />
            ) : null}

            <Card className={cn(surfaceCard, "space-y-2 p-4 shadow-none")}>
              <p className="text-sm font-semibold text-text-dark">Actions</p>
              {tx.status === "COMPLETED" && !hasReviewed ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 rounded-xl border-slate-200 shadow-sm"
                  onClick={() => setReviewOpen(true)}
                >
                  <Star className="h-4 w-4" />
                  Laisser un avis
                </Button>
              ) : null}

              {showDispute ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full rounded-xl text-danger hover:bg-danger/[0.06]"
                  onClick={() => setDisputeOpen(true)}
                >
                  <AlertTriangle className="mr-2 inline h-4 w-4" />
                  Signaler un problème
                </Button>
              ) : null}
            </Card>
          </div>
        </div>

        <BottomSheet
          open={disputeOpen}
          onClose={() => setDisputeOpen(false)}
          title="Litige"
        >
          <textarea
            className="input-field-surface mb-3 min-h-[100px] rounded-xl"
            placeholder="Décrivez le problème"
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
          />
          <Button
            type="button"
            className="w-full rounded-xl"
            onClick={() => void submitDispute()}
          >
            Envoyer
          </Button>
        </BottomSheet>

        <BottomSheet
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          title="Votre avis"
        >
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-text-dark">Note</p>
              <p className="mt-1 text-xs text-text-muted">
                Appuyez sur les étoiles pour choisir.
              </p>
              <div className="mt-2">
                <StarRating
                  value={rating}
                  onChange={(n) => setRating(Math.min(5, Math.max(1, n)))}
                />
              </div>
            </div>
            <textarea
              className="input-field-surface min-h-[80px] rounded-xl"
              placeholder="Commentaire (optionnel)"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
            <Button
              type="button"
              className="w-full rounded-xl"
              onClick={() => void submitReview()}
            >
              Publier
            </Button>
          </div>
        </BottomSheet>
      </div>
    </div>
  );
}
