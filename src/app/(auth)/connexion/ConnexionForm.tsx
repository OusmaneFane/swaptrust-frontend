"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ConnexionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/tableau-de-bord";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { remember: true },
  });

  async function onSubmit(values: FormValues) {
    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    if (res?.error) {
      toast.error("Email ou mot de passe incorrect");
      return;
    }
    toast.success("Connexion réussie");
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <Card className="p-8">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold text-text-dark">
          Bienvenue
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Connectez-vous à DoniSend
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <label className="flex cursor-pointer items-center justify-center gap-2 text-sm text-text-muted">
          <input
            type="checkbox"
            className="rounded border-line"
            {...register("remember")}
          />
          Se souvenir de moi
        </label>
        <p className="mt-2 text-center text-sm text-text-dark">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-accent hover:underline">
            Inscription
          </Link>
        </p>
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Se connecter
        </Button>
      </form>
      <p className="mt-6 text-center text-xs text-text-muted">
        copyright © {new Date().getFullYear()} DoniTech Inc. <br />
        Tous droits réservés.
      </p>
    </Card>
  );
}
