'use client'

import { Sparkles, Leaf, Wallet, FileCheck } from 'lucide-react'
import { AnimatedCounter } from '@/components/onboarding/AnimatedCounter'
import { Confetti } from '@/components/onboarding/Confetti'
import type { MomentWow } from '@/types/vida'

export function StepWow({ wow, name }: { wow: MomentWow; name: string }) {
  const firstName = name.split(' ')[0]
  return (
    <>
      <Confetti count={70} />
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">Moment WOW</p>
          <h1
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Voici ce qui t&apos;attend, {firstName} <Sparkles className="inline text-amber-400" size={28} />
          </h1>
        </div>

        {/* Hero gain mensuel */}
        <div className="glass rounded-3xl p-6 space-y-2">
          <p className="text-sm text-white/55">Gain mensuel estimé en mobilité propre</p>
          <p
            className="text-5xl md:text-6xl font-bold gradient-text-aurora"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <AnimatedCounter value={wow.gain_mensuel_estime_eur} suffix=" €" decimals={2} />
          </p>
          <p className="text-xs text-white/45">
            Sur la base de {wow.km_propre_semaine} km / semaine.
          </p>
        </div>

        {/* Triple KPI */}
        <div className="grid grid-cols-3 gap-3">
          <KpiTile
            icon={<Leaf size={18} />}
            color="emerald"
            value={
              <AnimatedCounter value={wow.co2_evite_mensuel_kg} suffix=" kg" decimals={1} />
            }
            label="CO₂ évité / mois"
          />
          <KpiTile
            icon={<FileCheck size={18} />}
            color="cyan"
            value={<AnimatedCounter value={wow.aides_detectees_count} />}
            label="Aides détectées"
          />
          <KpiTile
            icon={<Wallet size={18} />}
            color="violet"
            value={<AnimatedCounter value={wow.aides_potentielles_eur} suffix=" €" />}
            label="Potentiel aides"
          />
        </div>

        {/* Première action */}
        <div className="glass rounded-2xl p-4 text-left">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-400/80 mb-1">Première action — 30 sec</p>
          <p className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            {wow.premier_action.label}
          </p>
        </div>

        <p className="text-xs text-white/40">
          Ces estimations s&apos;ajustent au fur et à mesure que tu utilises YATRA. Source : ADEME 2024 + barème YATRA officiel.
        </p>
      </div>
    </>
  )
}

function KpiTile({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode
  value: React.ReactNode
  label: string
  color: 'emerald' | 'cyan' | 'violet'
}) {
  const colorBg = {
    emerald: 'bg-emerald-500/10 text-emerald-300',
    cyan: 'bg-cyan-500/10 text-cyan-300',
    violet: 'bg-violet-500/10 text-violet-300',
  }[color]
  return (
    <div className="glass rounded-xl p-3 space-y-2">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto ${colorBg}`}>{icon}</div>
      <p className="text-lg font-bold leading-none" style={{ fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-white/45 leading-tight">{label}</p>
    </div>
  )
}
