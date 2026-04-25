"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/services/api";

const schema = z
  .object({
    newPassword: z.string().min(8, "Minimum 8 caractères"),
    confirmPassword: z.string().min(8, "Minimum 8 caractères"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Les mots de passe ne correspondent pas",
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams?.get("token")?.trim() ?? "", [searchParams]);

  const [validating, setValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        if (!cancelled) {
          setIsValidToken(false);
          setValidating(false);
        }
        return;
      }
      try {
        setValidating(true);
        const res = await authApi.passwordResetValidate(token);
        if (!cancelled) setIsValidToken(res.valid === true);
      } catch {
        if (!cancelled) setIsValidToken(false);
      } finally {
        if (!cancelled) setValidating(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSubmit(values: FormValues) {
    if (!token) {
      toast.error("Lien invalide");
      return;
    }
    try {
      await authApi.passwordReset(token, values.newPassword);
      toast.success("Mot de passe réinitialisé — reconnectez-vous");
      router.push("/connexion");
      router.refresh();
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 401) {
        toast.error("Lien expiré ou déjà utilisé");
      } else {
        toast.error("Réinitialisation impossible — vérifiez l’API");
      }
    }
  }

  if (validating) {
    return (
      <Card className="p-8 text-center">
        <h1 className="font-display text-2xl font-bold text-text-dark">
          Réinitialisation
        </h1>
        <p className="mt-3 text-sm text-text-secondary">
          Vérification du lien…
        </p>
      </Card>
    );
  }

  if (!isValidToken) {
    return (
      <Card className="p-8 text-center">
        <h1 className="font-display text-2xl font-bold text-text-dark">
          Lien invalide
        </h1>
        <p className="mt-3 text-sm text-text-secondary">
          Ce lien est expiré ou incorrect.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link href="/forgot-password" className="text-accent hover:underline">
            Demander un nouveau lien
          </Link>
          <Link href="/connexion" className="text-accent hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold text-text-dark">
          Nouveau mot de passe
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Choisissez un nouveau mot de passe.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <Input
          label="Nouveau mot de passe"
          type="password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <Input
          label="Confirmer le mot de passe"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Réinitialiser
        </Button>
      </form>
    </Card>
  );
}

