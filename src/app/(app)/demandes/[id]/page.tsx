"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { requestsApi } from "@/services/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { RequestExpiryCountdown } from "@/components/client/RequestExpiryCountdown";
import { formatCFA, formatRUB } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/constants/payment-methods";

export default function DemandeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const idParam = params?.id;
  const id = Number(Array.isArray(idParam) ? idParam[0] : idParam);

  const { data: r, isLoading } = useQuery({
    queryKey: ["requests", id],
    queryFn: () => requestsApi.getById(id),
    enabled: Number.isFinite(id),
  });

  const cancelMut = useMutation({
    mutationFn: () => requestsApi.cancel(id),
    onSuccess: () => {
      toast.success("Demande annulée");
      void qc.invalidateQueries({ queryKey: ["requests"] });
      router.push("/mes-demandes");
    },
    onError: () => toast.error("Annulation impossible"),
  });

  if (!Number.isFinite(id)) {
    return <p className="text-sm text-text-muted">Demande invalide.</p>;
  }

  if (isLoading || !r) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full rounded-card" />
      </div>
    );
  }

  const needRub = r.type === "NEED_RUB";
  const canCancel = r.status === "PENDING";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href="/mes-demandes"
        className="text-sm font-medium text-primary hover:underline"
      >
        ← Mes demandes
      </Link>
      <h1 className="font-display text-xl font-bold text-text-dark">
        Demande #{r.id}
      </h1>

      <Card className="space-y-3 p-5 text-sm">
        <div className="flex justify-between">
          <span className="text-text-muted">Statut</span>
          <span className="font-medium text-text-dark">
            {r.status}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Vous recevez</span>
          <span className="font-semibold text-text-dark">
            {needRub ? formatRUB(r.amountWanted) : formatCFA(r.amountWanted)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Vous envoyez</span>
          <span className="font-semibold text-accent">
            {needRub ? formatCFA(r.amountToSend) : formatRUB(r.amountToSend)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Via</span>
          <span className="font-medium text-text-dark">
            {PAYMENT_METHOD_LABELS[r.paymentMethod]}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Réception</span>
          <span className="font-medium text-text-dark">{r.phoneToSend}</span>
        </div>
        {r.note ? <p className="text-slate-600">« {r.note} »</p> : null}
      </Card>

      {r.status === "PENDING" ? (
        <Card className="border-primary/20 bg-primary/[0.04] p-5">
          <RequestExpiryCountdown expiresAt={r.expiresAt} />
        </Card>
      ) : null}

      {canCancel ? (
        <Button
          type="button"
          variant="outline"
          className="w-full text-danger"
          loading={cancelMut.isPending}
          onClick={() => cancelMut.mutate()}
        >
          Annuler la demande
        </Button>
      ) : null}
    </div>
  );
}
