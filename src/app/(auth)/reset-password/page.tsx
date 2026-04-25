import { Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { ResetPasswordClient } from "./ResetPasswordClient";

function Fallback() {
  return (
    <Card className="p-8 text-center">
      <h1 className="font-display text-2xl font-bold text-text-dark">
        Réinitialisation
      </h1>
      <p className="mt-3 text-sm text-text-secondary">Chargement…</p>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
