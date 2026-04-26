"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { publicReceiptsApi } from "@/services/api";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReceiptVerifyClient({ token }: { token: string }) {
  const cleanToken = token.trim();

  const query = useQuery({
    queryKey: ["public-receipt-verify", cleanToken],
    queryFn: () => publicReceiptsApi.verify(cleanToken),
    enabled: cleanToken.length > 0,
  });

  const state:
    | { kind: "missing" }
    | { kind: "loading" }
    | { kind: "error" }
    | { kind: "valid" }
    | { kind: "invalid" } =
    cleanToken.length === 0
      ? { kind: "missing" }
      : query.isLoading
        ? { kind: "loading" }
        : query.isError
          ? { kind: "error" }
          : query.data?.valid
            ? { kind: "valid" }
            : { kind: "invalid" };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-white to-surface px-4 py-10">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-52 right-[-120px] h-[560px] w-[560px] rounded-full bg-accent/10 blur-3xl"
        aria-hidden
      />

      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-center">
          <Link href="/" aria-label="DoniSend — Accueil" className="inline-flex">
            <Logo size="lg" variant="light" className="drop-shadow-sm" />
          </Link>
        </div>

        <Card className="mt-8 p-7 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <h1 className="font-display text-2xl font-bold tracking-tight text-text-dark">
                Vérification de reçu
              </h1>
              <p className="max-w-prose text-sm text-text-secondary">
                Confirmez l’authenticité d’un reçu DoniSend.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-success" aria-hidden />
              <Badge tone="muted">Public</Badge>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
            {state.kind === "missing" ? (
              <div className="flex gap-4">
                <ShieldAlert className="mt-0.5 h-6 w-6 text-warning" aria-hidden />
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone="warning">Token manquant</Badge>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">
                    Ajoutez{" "}
                    <span className="rounded-md bg-white px-2 py-0.5 font-mono text-xs text-text-dark">
                      ?token=…
                    </span>{" "}
                    dans l’URL.
                  </p>
                </div>
              </div>
            ) : state.kind === "loading" ? (
              <div className="flex items-start gap-4">
                <Spinner className="mt-1 h-6 w-6 border-muted border-t-primary" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="default">Vérification en cours</Badge>
                    <span className="text-xs text-ink-muted">•</span>
                    <span className="truncate font-mono text-xs text-ink-muted">
                      {cleanToken}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">
                    Nous interrogeons l’API pour confirmer la validité du reçu.
                  </p>
                </div>
              </div>
            ) : state.kind === "error" ? (
              <div className="flex gap-4">
                <XCircle className="mt-0.5 h-6 w-6 text-danger" aria-hidden />
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone="danger">Erreur</Badge>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">
                    Impossible de vérifier ce reçu pour le moment. Réessayez plus tard.
                  </p>
                </div>
              </div>
            ) : state.kind === "valid" ? (
              <div className="flex gap-4">
                <CheckCircle2 className="mt-0.5 h-6 w-6 text-success" aria-hidden />
                <div className="w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="success">Reçu valide</Badge>
                    <span className="text-xs text-ink-muted">•</span>
                    <span className="font-medium text-text-dark">
                      Certificat confirmé
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-xl border border-primary/10 bg-white p-4">
                    {typeof query.data?.transactionId === "number" ? (
                      <div className="flex items-baseline justify-between gap-4">
                        <div className="text-xs font-medium text-ink-muted">
                          Transaction
                        </div>
                        <div className="font-mono text-sm text-text-dark">
                          #{query.data.transactionId}
                        </div>
                      </div>
                    ) : null}
                    {query.data?.receiptFilename ? (
                      <div className="flex items-baseline justify-between gap-4">
                        <div className="text-xs font-medium text-ink-muted">Fichier</div>
                        <div className="truncate font-mono text-sm text-text-dark">
                          {query.data.receiptFilename}
                        </div>
                      </div>
                    ) : null}
                    {query.data?.completedAt ? (
                      <div className="flex items-baseline justify-between gap-4">
                        <div className="text-xs font-medium text-ink-muted">
                          Complété le
                        </div>
                        <div className="font-mono text-sm text-text-dark">
                          {fmtDate(query.data.completedAt)}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <p className="mt-3 text-xs text-ink-muted">
                    Vérification via{" "}
                    <span className="font-mono">/api/v1/public/receipts/verify</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                <XCircle className="mt-0.5 h-6 w-6 text-text-muted" aria-hidden />
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone="muted">Reçu invalide</Badge>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">
                    Ce token ne correspond à aucun reçu valide.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">
                Retour à l’accueil
              </Button>
            </Link>
            <div className="text-center text-xs text-ink-muted sm:text-right">
              DoniSend — échange sécurisé CFA ↔ RUB
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

