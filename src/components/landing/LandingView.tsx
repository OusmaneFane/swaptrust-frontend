'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield,
  Zap,
  Lock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { RateDisplay } from '@/components/exchange/RateDisplay';
import type { ExchangeRate } from '@/types/api-dtos';
import { Button } from '@/components/ui/Button';

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

export function LandingView({ initialRate }: { initialRate: ExchangeRate }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-app">
      <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 animate-blob rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 animate-blob rounded-full bg-accent/15 blur-3xl [animation-delay:-3s]" />

      <header className="relative z-10 flex items-center justify-between border-b border-line/60 bg-card/80 px-4 py-5 shadow-sm backdrop-blur-md lg:px-12">
        <span className="font-display text-xl font-bold text-ink">
          Swap<span className="text-primary">Trust</span>
        </span>
        <div className="flex gap-3">
          <Link
            href="/connexion"
            className="rounded-pill px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-hover"
          >
            Connexion
          </Link>
          <Link href="/inscription">
            <Button type="button" className="py-2 text-sm">
              Commencer
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-8 lg:px-8 lg:pt-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 inline-flex items-center gap-2 rounded-pill border border-accent/30 bg-accent-soft/80 px-3 py-1 text-xs font-semibold text-accent"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Taux mis à jour en continu
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="font-display text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl lg:text-6xl"
            >
              Échangez CFA & roubles{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                en toute confiance
              </span>
            </motion.h1>
            <p className="mt-6 max-w-xl text-lg text-ink-secondary">
              Escrow, chat sécurisé et suivi étape par étape. Inspiré des meilleures apps
              fintech — simple sur mobile, rassurant pour vos échanges.
            </p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Link href="/inscription">
                <Button type="button" className="inline-flex items-center gap-2">
                  Créer un compte
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link
                href="/connexion"
                className="inline-flex items-center rounded-pill border border-line bg-card px-6 py-3 text-sm font-semibold text-ink shadow-sm transition-all hover:border-primary/40 hover:bg-surface active:scale-95"
              >
                J’ai déjà un compte
              </Link>
            </motion.div>

            <motion.ul
              variants={container}
              initial="hidden"
              animate="show"
              className="mt-14 grid gap-6 sm:grid-cols-3"
            >
              {[
                { n: '500+', l: 'échanges', Icon: Zap },
                { n: '0', l: 'arnaque signalée', Icon: Shield },
                { n: '2%', l: 'commission', Icon: Lock },
              ].map(({ n, l, Icon }) => (
                <motion.li
                  key={l}
                  variants={item}
                  className="glass-card flex flex-col gap-2 p-4 text-center sm:text-left"
                >
                  <Icon className="mx-auto h-6 w-6 text-primary sm:mx-0" />
                  <span className="animate-count-up font-display text-2xl font-bold text-ink">
                    {n}
                  </span>
                  <span className="text-sm text-ink-muted">{l}</span>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          <RateDisplay
            rate={initialRate.rate}
            inverseRate={initialRate.inverseRate}
            trend={initialRate.trend}
            percentChange={initialRate.percentChange}
            fetchedAt={initialRate.fetchedAt}
            className="lg:translate-y-4"
          />
        </div>

        <section className="mt-24">
          <h2 className="mb-10 text-center font-display text-2xl font-bold text-ink md:text-3xl">
            Comment ça marche
          </h2>
          <motion.ol
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="grid gap-6 md:grid-cols-3"
          >
            {[
              {
                title: 'Publiez ou choisissez une offre',
                desc: 'Montant, moyen de paiement et taux transparents.',
                Icon: TrendingUp,
              },
              {
                title: 'Escrow sécurisé',
                desc: 'Les fonds suivent un parcours clair jusqu’à la libération.',
                Icon: Lock,
              },
              {
                title: 'Chat & preuves',
                desc: 'Échangez en direct et joignez vos justificatifs.',
                Icon: Shield,
              },
            ].map(({ title, desc, Icon }, i) => (
              <motion.li
                key={title}
                variants={item}
                className="glass-card flex flex-col gap-3 p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-display font-bold text-primary">
                  {i + 1}
                </span>
                <Icon className="h-6 w-6 text-accent" />
                <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
                <p className="text-sm text-ink-secondary">{desc}</p>
              </motion.li>
            ))}
          </motion.ol>
        </section>
      </main>
    </div>
  );
}
