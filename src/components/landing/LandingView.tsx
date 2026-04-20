"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  Lock,
  ArrowRight,
  Menu,
  X,
  Wallet,
  MessageCircle,
  ShieldCheck,
  Clock,
  BadgePercent,
  Sparkles,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { RateDisplay } from "@/components/exchange/RateDisplay";
import type { ExchangeRate } from "@/types/api-dtos";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { settingsApi } from "@/services/api";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const WHATSAPP_ICON_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

export function LandingView({ initialRate }: { initialRate: ExchangeRate }) {
  const [mobileMenu, setMobileMenu] = useState(false);

  /** Public, sans authentification — même enveloppe `{ data, success }` que le reste de l’API. */
  const { data: publicSettings } = useQuery({
    queryKey: ["settings", "public", "landing"],
    queryFn: () => settingsApi.public(),
    staleTime: 60_000,
  });

  const commissionPct =
    publicSettings != null &&
    Number.isFinite(publicSettings.commissionPercent) &&
    publicSettings.commissionPercent >= 0
      ? publicSettings.commissionPercent
      : null;

  const baseCommissionPct =
    publicSettings != null &&
    Number.isFinite(publicSettings.commissionBasePercent) &&
    publicSettings.commissionBasePercent >= 0
      ? publicSettings.commissionBasePercent
      : null;

  const promoCommissionPct =
    publicSettings != null &&
    publicSettings.commissionPromoPercent != null &&
    Number.isFinite(publicSettings.commissionPromoPercent) &&
    publicSettings.commissionPromoPercent >= 0
      ? publicSettings.commissionPromoPercent
      : null;

  const promoActive = publicSettings?.isCommissionPromoActive === true;
  const promoEndsAt =
    promoActive && typeof publicSettings?.commissionPromoEndsAt === "string"
      ? publicSettings.commissionPromoEndsAt
      : null;

  function pctLabel(n: number): string {
    if (!Number.isFinite(n)) return "—";
    const s = n.toFixed(2);
    return s.endsWith(".00") ? s.slice(0, -3) : s;
  }

  function dateLabelFr(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileMenu(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 animate-blob rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 animate-blob rounded-full bg-accent/10 blur-3xl [animation-delay:-3s]" />

      <header className="sticky top-0 z-20 border-b border-primary/15 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-10xl items-center justify-between gap-4 px-4 py-4 lg:px-12">
          <div className="flex items-center gap-4">
            <Logo variant="light" size="md" className="ml-2" />
            <nav className="hidden items-center gap-1 rounded-pill border border-primary/10 bg-white px-2 py-1 lg:flex">
              {[
                { href: "#fonctionnalites", label: "Fonctionnalités" },
                { href: "#cas-usage", label: "Cas d'usage" },
                { href: "#comment-ca-marche", label: "Comment ça marche" },
                { href: "#tarifs", label: "Tarifs" },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="rounded-pill px-3 py-2 text-sm font-semibold text-text-muted transition-colors hover:bg-primary/[0.06] hover:text-primary"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/connexion"
              className="hidden rounded-pill px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:bg-primary/[0.06] sm:inline-flex"
            >
              Connexion
            </Link>
            <Link href="/inscription" className="hidden sm:inline-flex">
              <Button type="button" className="py-2 text-sm">
                Commencer
              </Button>
            </Link>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-pill border border-primary/15 bg-white p-2 text-primary shadow-sm transition-colors hover:bg-primary/[0.04] lg:hidden"
              aria-label="Menu"
              aria-expanded={mobileMenu}
              onClick={() => setMobileMenu((v) => !v)}
            >
              {mobileMenu ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {mobileMenu ? (
          <div className="border-t border-primary/10 bg-white/90 backdrop-blur lg:hidden">
            <div className="mx-auto max-w-10xl space-y-2 px-4 py-4 lg:px-12">
              <div className="grid gap-2">
                {[
                  { href: "#fonctionnalites", label: "Fonctionnalités" },
                  { href: "#cas-usage", label: "Cas d'usage" },
                  { href: "#comment-ca-marche", label: "Comment ça marche" },
                  { href: "#tarifs", label: "Tarifs" },
                ].map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="rounded-card border border-primary/10 bg-white px-4 py-3 text-sm font-semibold text-text-dark shadow-sm"
                    onClick={() => setMobileMenu(false)}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  href="/connexion"
                  className="inline-flex items-center justify-center rounded-pill border border-primary/15 bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm"
                  onClick={() => setMobileMenu(false)}
                >
                  Connexion
                </Link>
                <Link href="/inscription" onClick={() => setMobileMenu(false)}>
                  <Button type="button" className="w-full py-2 text-sm">
                    Commencer
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main className="relative z-10 mx-auto max-w-10xl px-4 pb-24 pt-8 lg:px-8 lg:pt-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 inline-flex items-center gap-2 rounded-pill border border-accent/30 bg-accent-soft/80 px-3 py-1 text-xs font-semibold text-white"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Taux mis à jour en continu
            </motion.p>
            <Logo variant="light" size="lg" className="mb-2" />
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="font-display text-3xl font-bold leading-tight text-text-dark md:text-5xl lg:text-6xl"
            >
              L&apos;échange sécurisé
              <br />
              <span className="text-accent">CFA ↔ Roubles</span>
            </motion.h1>
            <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-accent">
              <MessageCircle className="h-4 w-4" />
              Notifications WhatsApp en temps réel (à chaque étape)
            </p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Link href="/inscription">
                <Button
                  type="button"
                  className="inline-flex items-center gap-2"
                >
                  Créer un compte
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link
                href="/connexion"
                className="inline-flex items-center rounded-pill border border-primary/20 bg-white px-6 py-3 text-sm font-semibold text-primary shadow-sm transition-all hover:border-primary/35 hover:bg-primary/[0.04] active:scale-95"
              >
                J’ai déjà un compte
              </Link>
            </motion.div>

            {/* Mobile-only: bloc compact juste après les CTA */}
            <div className="mt-6 space-y-3 lg:hidden">
              <div className="relative overflow-hidden rounded-card border border-primary/15 bg-white/75 p-4 shadow-card-lg backdrop-blur-md">
                <div className="pointer-events-none absolute inset-0 opacity-90">
                  <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/25 blur-3xl" />
                  <div className="absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
                </div>

                <div className="relative z-10 grid grid-cols-[1fr_auto] items-center gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                      Commission
                    </p>

                    <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      {promoActive ? (
                        <>
                          <span className="text-xs font-semibold text-text-muted line-through decoration-2">
                            {baseCommissionPct == null
                              ? "—"
                              : `${pctLabel(baseCommissionPct)}%`}
                          </span>
                          <span className="font-display text-[28px] font-extrabold leading-none tracking-tight text-accent">
                            {promoCommissionPct == null
                              ? commissionPct == null
                                ? "—"
                                : `${pctLabel(commissionPct)}%`
                              : `${pctLabel(promoCommissionPct)}%`}
                          </span>
                          {promoEndsAt ? (
                            <span className="rounded-pill border border-accent/25 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">
                              jusqu’au {dateLabelFr(promoEndsAt)}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="font-display text-[28px] font-extrabold leading-none tracking-tight text-accent">
                          {commissionPct == null
                            ? "—"
                            : `${pctLabel(commissionPct)}%`}
                        </span>
                      )}
                    </div>

                    {promoActive ? (
                      <p className="mt-2 text-[11px] font-semibold text-text-muted">
                        Promo activée · prix réduit
                      </p>
                    ) : (
                      <p className="mt-2 text-[11px] font-semibold text-text-muted">
                        Affichée avant confirmation
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    <div className="[perspective:1000px]">
                      <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-accent/35 via-white to-primary/25 shadow-card-lg ring-1 ring-primary/15 [transform:rotateX(22deg)_rotateY(-20deg)]">
                        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.95),transparent_58%)]" />
                        <div className="absolute inset-[1px] rounded-2xl bg-white/20 backdrop-blur-[2px]" />
                        <div className="absolute -right-3 -top-3 h-10 w-10 rounded-full bg-accent/25 blur-xl" />
                        <div className="absolute -bottom-3 -left-3 h-10 w-10 rounded-full bg-primary/20 blur-xl" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <RateDisplay
                rate={initialRate.rate}
                inverseRate={initialRate.inverseRate}
                trend={initialRate.trend}
                percentChange={initialRate.percentChange}
                fetchedAt={initialRate.fetchedAt}
              />
            </div>

            <motion.ul
              variants={container}
              initial="hidden"
              animate="show"
              className="mt-14 grid gap-6 sm:grid-cols-3"
            >
              {[
                {
                  n: "500+",
                  l: "échanges",
                  Icon: Zap,
                  card: "bg-gradient-to-br from-accent/20 to-white border-accent/25",
                  icon: "text-accent",
                  glow: "from-accent/35 to-transparent",
                  chip: "bg-accent/15 text-accent ring-accent/25",
                },
                {
                  n: "0",
                  l: "arnaque signalée",
                  Icon: Shield,
                  card: "bg-gradient-to-br from-info/15 to-white border-info/25",
                  icon: "text-info",
                  glow: "from-info/30 to-transparent",
                  chip: "bg-info/15 text-info ring-info/25",
                },
                {
                  n:
                    commissionPct == null ? "—" : `${pctLabel(commissionPct)}%`,
                  l: "commission",
                  Icon: Lock,
                  card: "bg-gradient-to-br from-primary/15 to-white border-primary/25",
                  icon: "text-primary",
                  glow: "from-primary/30 to-transparent",
                  chip: "bg-primary/12 text-primary ring-primary/25",
                },
              ].map(({ n, l, Icon, card, icon, glow, chip }) => (
                <motion.li
                  key={l}
                  variants={item}
                  className={`group relative overflow-hidden rounded-card border p-5 text-center shadow-card-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-lg sm:text-left ${card}`}
                >
                  <div
                    className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${glow} blur-2xl opacity-60 transition-opacity duration-200 group-hover:opacity-80`}
                  />
                  <div className="relative z-10 flex items-center justify-between gap-4">
                    <span
                      className={`inline-flex items-center gap-2 rounded-pill px-3 py-1 text-xs font-semibold ring-1 ${chip}`}
                    >
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full ring-1 ${
                          chip.includes("accent")
                            ? "bg-accent/15 ring-accent/25"
                            : chip.includes("info")
                              ? "bg-info/15 ring-info/25"
                              : "bg-primary/12 ring-primary/25"
                        }`}
                        aria-hidden
                      >
                        <Icon className={`h-3.5 w-3.5 ${icon}`} />
                      </span>
                      Indicateur
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                      DoniSend
                    </span>
                  </div>

                  <div className="relative z-10 mt-4">
                    <span className="block animate-count-up font-display text-3xl font-extrabold leading-none text-text-dark">
                      {n}
                    </span>
                    <span className="mt-2 block text-sm font-semibold text-text-muted">
                      {l}
                    </span>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* Desktop-only: bloc commission + widget à droite */}
          <div className="hidden space-y-4 lg:block lg:translate-y-4">
            <div className="relative overflow-hidden rounded-card border border-primary/15 bg-white/70 p-4 shadow-card-lg backdrop-blur-md">
              <div className="pointer-events-none absolute inset-0 opacity-90">
                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
                <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
              </div>

              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Commission DoniSend
                  </p>

                  {promoActive ? (
                    <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-sm font-semibold text-text-muted line-through decoration-2">
                        {baseCommissionPct == null
                          ? "—"
                          : `${pctLabel(baseCommissionPct)}%`}
                      </span>
                      <span className="font-display text-3xl font-extrabold tracking-tight text-accent">
                        {promoCommissionPct == null
                          ? commissionPct == null
                            ? "—"
                            : `${pctLabel(commissionPct)}%`
                          : `${pctLabel(promoCommissionPct)}%`}
                      </span>
                      {promoEndsAt ? (
                        <span className="rounded-pill border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                          jusqu’au {dateLabelFr(promoEndsAt)}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-display text-3xl font-extrabold tracking-tight text-accent">
                        {commissionPct == null
                          ? "—"
                          : `${pctLabel(commissionPct)}%`}
                      </span>
                    </div>
                  )}
                </div>

                {/* “3D” orb */}
                <div className="hidden shrink-0 sm:block">
                  <div className="[perspective:900px]">
                    <div className="relative h-16 w-16 rotate-6 rounded-2xl bg-gradient-to-br from-accent/30 via-white to-primary/25 shadow-card-lg ring-1 ring-primary/15 [transform:rotateX(18deg)_rotateY(-18deg)]">
                      <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.9),transparent_55%)]" />
                      <div className="absolute -right-3 -top-3 h-10 w-10 rounded-full bg-accent/25 blur-xl" />
                      <div className="absolute -bottom-3 -left-3 h-10 w-10 rounded-full bg-primary/20 blur-xl" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <RateDisplay
              rate={initialRate.rate}
              inverseRate={initialRate.inverseRate}
              trend={initialRate.trend}
              percentChange={initialRate.percentChange}
              fetchedAt={initialRate.fetchedAt}
              className=""
            />
          </div>
        </div>

        <section id="fonctionnalites" className="mt-24 scroll-mt-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mx-auto inline-flex items-center gap-2 rounded-pill border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              Simple. Transparent. Sécurisé.
            </p>
            <h2 className="mt-4 font-display text-2xl font-bold text-text-dark md:text-3xl">
              Fonctionnalités
            </h2>
            <p className="mt-3 text-sm text-text-muted">
              Une expérience mobile fluide, avec un taux clair et une commission
              affichée séparément.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Taux Google + commission séparée",
                desc: "Le taux brut est affiché tel quel. La commission est visible, calculée à part.",
                Icon: BadgePercent,
                card: "from-accent/18 to-white border-accent/25",
                icon: "text-accent",
                bulletIcon: "text-accent",
                bullets: [
                  "Taux brut affiché",
                  "Commission transparente",
                  "Calcul immédiat",
                ],
              },
              {
                title: "Chat & preuves",
                desc: "Envoyez vos reçus, discutez en direct et suivez chaque étape de l’échange.",
                Icon: MessageCircle,
                card: "from-info/14 to-white border-info/25",
                icon: "text-info",
                bulletIcon: "text-info",
                bullets: ["Chat intégré", "Upload reçus", "Timeline claire"],
              },
              {
                title: "Sécurité & traçabilité",
                desc: "Instructions claires, suivi chronologique et validation des preuves.",
                Icon: ShieldCheck,
                card: "from-primary/14 to-white border-primary/25",
                icon: "text-primary",
                bulletIcon: "text-primary",
                bullets: [
                  "Étapes vérifiables",
                  "Preuves à chaque phase",
                  "Rassurant pour tous",
                ],
              },
            ].map(({ title, desc, Icon, card, icon, bullets, bulletIcon }) => (
              <div
                key={title}
                className={`group relative overflow-hidden rounded-card border bg-gradient-to-br p-6 shadow-card-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-lg ${card}`}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
                  <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-accent/10 blur-2xl" />
                </div>

                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm ring-1 ${icon} ${
                      icon.includes("accent")
                        ? "bg-accent/15 ring-accent/25"
                        : icon.includes("info")
                          ? "bg-info/15 ring-info/25"
                          : "bg-primary/12 ring-primary/25"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-pill bg-white/80 px-3 py-1 text-xs font-semibold text-text-muted ring-1 ring-primary/10">
                    Inclus
                  </span>
                </div>

                <h3 className="relative z-10 mt-4 font-display text-lg font-semibold text-text-dark">
                  {title}
                </h3>
                <p className="relative z-10 mt-2 text-sm text-text-muted">
                  {desc}
                </p>

                <ul className="relative z-10 mt-4 space-y-2 text-sm text-text-muted">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <CheckCircle2
                        className={`mt-0.5 h-4 w-4 ${bulletIcon}`}
                      />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-card border border-accent/20 bg-gradient-to-br from-accent/12 to-white p-5 shadow-card-lg">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-accent ring-1 ring-accent/20 shadow-sm">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-base font-semibold text-text-dark">
                    Notifications WhatsApp en temps réel
                  </p>
                  <p className="mt-0.5 text-sm text-text-muted">
                    Reçois un message à chaque étape: prise en charge, reçu
                    validé, fonds envoyés, clôture.
                  </p>
                </div>
              </div>
              <span className="inline-flex w-fit items-center rounded-pill bg-accent px-3 py-1 text-xs font-bold text-bg-dark">
                WhatsApp
              </span>
            </div>
          </div>
        </section>

        <section id="cas-usage" className="mt-20 scroll-mt-28">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-2xl font-bold text-text-dark md:text-3xl">
              Cas d&apos;usage
            </h2>
            <p className="mt-3 text-sm text-text-muted">
              DoniSend s’adapte aux scénarios réels du quotidien.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Étudiants & familles",
                desc: "Recevoir/envoyer rapidement, avec un suivi clair.",
                Icon: Wallet,
                badge: "Rapide",
                badgeClass: "bg-accent/15 text-accent",
              },
              {
                title: "Achats & services",
                desc: "Payer côté CFA et recevoir côté RUB (ou inverse).",
                Icon: Lock,
                badge: "Sécurisé",
                badgeClass: "bg-primary/12 text-primary",
              },
              {
                title: "Urgences",
                desc: "Prioriser une transaction et rester informé en temps réel.",
                Icon: Clock,
                badge: "Temps réel",
                badgeClass: "bg-info/12 text-info",
              },
            ].map(({ title, desc, Icon, badge, badgeClass }) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-card border border-primary/10 bg-white p-6 shadow-card-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-lg"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/8 blur-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1 shadow-sm ${
                      badgeClass.includes("accent")
                        ? "bg-accent/15 text-accent ring-accent/25"
                        : badgeClass.includes("info")
                          ? "bg-info/15 text-info ring-info/25"
                          : "bg-primary/12 text-primary ring-primary/25"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`rounded-pill px-3 py-1 text-xs font-semibold ${badgeClass}`}
                  >
                    {badge}
                  </span>
                </div>
                <h3 className="relative z-10 mt-4 font-display text-lg font-semibold text-text-dark">
                  {title}
                </h3>
                <p className="relative z-10 mt-2 text-sm text-text-muted">
                  {desc}
                </p>

                <div className="relative z-10 mt-4 flex items-center gap-2 text-xs font-semibold text-text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span>Optimisé pour CFA ↔ RUB</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="comment-ca-marche" className="mt-20 scroll-mt-28">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <h2 className="font-display text-2xl font-bold text-text-dark md:text-3xl">
              Comment ça marche
            </h2>
            <p className="mt-3 text-sm text-text-muted">
              À chaque étape, DoniSend peut vous envoyer une{" "}
              <span className="font-semibold text-accent">
                notification WhatsApp
              </span>{" "}
              (si vous avez ajouté votre numéro).
            </p>
          </div>
          <motion.ol
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-6 md:grid-cols-3"
          >
            {[
              {
                title: "Publiez votre besoin",
                desc: "Montant en CFA ou roubles, moyen de paiement et taux affiché clairement.",
                Icon: TrendingUp,
                iconWrap:
                  "bg-gradient-to-br from-accent/18 to-white text-accent ring-accent/20",
                whatsapp: "WhatsApp: demande publiée + récapitulatif.",
              },
              {
                title: "Un opérateur prend le relais",
                desc: "Prise en charge, numéro d’envoi et suivi jusqu’à la clôture.",
                Icon: Lock,
                iconWrap:
                  "bg-gradient-to-br from-primary/14 to-white text-primary ring-primary/20",
                whatsapp:
                  "WhatsApp: opérateur assigné + instructions de paiement.",
              },
              {
                title: "Chat & preuves",
                desc: "Échangez en direct et joignez vos reçus à chaque étape.",
                Icon: Shield,
                iconWrap:
                  "bg-gradient-to-br from-info/12 to-white text-info ring-info/20",
                whatsapp:
                  "WhatsApp: reçu validé, fonds envoyés, échange clôturé.",
              },
            ].map(({ title, desc, Icon, iconWrap, whatsapp }, i) => (
              <motion.li
                key={title}
                variants={item}
                className="group relative overflow-hidden flex flex-col gap-3 rounded-card border border-primary/10 bg-white/80 p-6 shadow-card-lg backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-lg"
              >
                <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary/8 blur-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1 shadow-sm ${iconWrap}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-pill bg-white/80 px-3 py-1 text-xs font-semibold text-text-muted ring-1 ring-primary/10">
                    Étape {i + 1}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-text-dark">
                  {title}
                </h3>
                <p className="text-sm text-text-muted">{desc}</p>

                <div className="mt-1 flex items-start gap-2 rounded-card border border-accent/15 bg-accent/5 p-3 text-xs text-text-muted">
                  <svg
                    viewBox="0 0 24 24"
                    className="mt-0.5 h-4 w-4 shrink-0"
                    fill="#25D366"
                    aria-hidden
                  >
                    <path d={WHATSAPP_ICON_PATH} />
                  </svg>
                  <p>
                    <span className="font-semibold text-text-dark">
                      Notification
                    </span>{" "}
                    — {whatsapp}
                  </p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </section>

        <section id="tarifs" className="mt-20 scroll-mt-28">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-2xl font-bold text-text-dark md:text-3xl">
              Tarifs
            </h2>
            <p className="mt-3 text-sm text-text-muted">
              Transparent: taux Google brut, commission séparée.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="group relative overflow-hidden rounded-card border border-primary/10 bg-white p-6 shadow-card-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-lg">
              <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary/8 blur-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/25 shadow-sm">
                  <BadgePercent className="h-5 w-5" />
                </div>
                <span className="rounded-pill bg-primary/8 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/10">
                  Standard
                </span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Commission
              </p>
              <p className="mt-2 font-display text-3xl font-bold text-text-dark">
                {commissionPct == null ? "—" : `${pctLabel(commissionPct)}%`}
                <span className="ml-2 text-sm font-semibold text-text-muted">
                  par échange
                </span>
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-text-muted">
                {[
                  "Commission affichée à part",
                  "Chat & preuves",
                  "Suivi étape par étape",
                  "Notifications WhatsApp (si numéro ajouté)",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-accent" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <Link href="/inscription" className="mt-6 block">
                <Button type="button" className="w-full">
                  Commencer
                </Button>
              </Link>
            </div>

            <div className="group relative overflow-hidden rounded-card border border-accent/25 bg-gradient-to-br from-accent/18 to-white p-6 shadow-card-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-lg">
              <div className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-accent/18 blur-2xl opacity-70" />
              <span className="absolute right-4 top-4 rounded-pill bg-accent px-3 py-1 text-xs font-bold text-bg-dark shadow-sm">
                Recommandé
              </span>
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/25 shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="rounded-pill bg-white/70 px-3 py-1 text-xs font-semibold text-text-dark ring-1 ring-accent/15">
                  Prioritaire
                </span>
              </div>
              <p className="mt-2 font-display text-3xl font-bold text-text-dark">
                {commissionPct == null ? "—" : `${pctLabel(commissionPct)}%`}
                <span className="ml-2 text-sm font-semibold text-text-muted">
                  + prise en charge rapide
                </span>
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-text-muted">
                {[
                  "Priorité opérateur",
                  "Notifications WhatsApp en temps réel",
                  "Support réactif",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-accent" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <Link href="/inscription" className="mt-6 block">
                <Button type="button" className="w-full">
                  Essayer
                </Button>
              </Link>
            </div>

            <div className="group relative overflow-hidden rounded-card border border-info/25 bg-gradient-to-br from-info/12 to-white p-6 shadow-card-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-lg">
              <div className="pointer-events-none absolute -right-16 -bottom-16 h-56 w-56 rounded-full bg-info/12 blur-2xl opacity-80" />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-info/15 text-info ring-1 ring-info/25 shadow-sm">
                  <Wallet className="h-5 w-5" />
                </div>
                <span className="rounded-pill bg-white/70 px-3 py-1 text-xs font-semibold text-info ring-1 ring-info/15">
                  Entreprises
                </span>
              </div>
              <p className="mt-2 font-display text-3xl font-bold text-text-dark">
                Sur devis
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-text-muted">
                {[
                  "Volumes & besoins spécifiques",
                  "Comptes dédiés",
                  "Reporting",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-accent" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className="mt-6 inline-flex w-full items-center justify-center rounded-pill border border-primary/15 bg-white px-4 py-3 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-primary/[0.04]"
              >
                Contact
              </a>
            </div>
          </div>
        </section>

        <footer className="mt-24">
          <div className="rounded-card border border-primary/10 bg-white/80 p-8 shadow-card-lg backdrop-blur">
            <div className="grid gap-10 md:grid-cols-3">
              <div>
                <Logo variant="light" size="md" />
                <p className="mt-3 text-sm text-text-muted">
                  Échange sécurisé CFA ↔ RUB avec taux Google brut, commission
                  séparée et notifications WhatsApp à chaque étape.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-text-muted">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="#25D366"
                    aria-hidden
                  >
                    <path d={WHATSAPP_ICON_PATH} />
                  </svg>
                  <span>Notifications WhatsApp en temps réel</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Sections
                  </p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {[
                      { href: "#fonctionnalites", label: "Fonctionnalités" },
                      { href: "#cas-usage", label: "Cas d'usage" },
                      {
                        href: "#comment-ca-marche",
                        label: "Comment ça marche",
                      },
                      { href: "#tarifs", label: "Tarifs" },
                    ].map((l) => (
                      <li key={l.href}>
                        <a
                          href={l.href}
                          className="font-semibold text-primary hover:underline"
                        >
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Accès
                  </p>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li>
                      <Link
                        href="/connexion"
                        className="font-semibold text-primary hover:underline"
                      >
                        Connexion
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/inscription"
                        className="font-semibold text-primary hover:underline"
                      >
                        Inscription
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Contact
                </p>
                <p className="mt-3 text-sm text-text-muted">
                  Besoin d’aide ? Écrivez-nous sur WhatsApp après création de
                  compte, ou via le support intégré.
                </p>
                <Link href="/inscription" className="mt-5 inline-flex">
                  <Button type="button" className="py-2 text-sm">
                    Créer un compte
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-2 border-t border-primary/10 pt-6 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
              <span>
                © {new Date().getFullYear()} DoniSend. Tous droits réservés.
              </span>
              <span className="font-semibold">
                Taux Google brut · Commission séparée · WhatsApp à chaque étape
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
