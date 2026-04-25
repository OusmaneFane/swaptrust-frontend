"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/services/api";

const schema = z.object({
  email: z.string().email("Email invalide"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    try {
      await authApi.passwordForgot(values.email);
      toast.success("Si un compte existe, vous recevrez un lien WhatsApp");
      reset({ email: "" });
    } catch {
      // Anti-énumération: même message côté UI
      toast.success("Si un compte existe, vous recevrez un lien WhatsApp");
    }
  }

  return (
    <Card className="p-8">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold text-text-dark">
          Mot de passe oublié
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Saisissez votre email pour recevoir un lien WhatsApp.
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

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Envoyer le lien
        </Button>

        <p className="text-center text-sm text-text-dark">
          <Link href="/connexion" className="text-accent hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </form>
    </Card>
  );
}

