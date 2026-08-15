'use client'

import { useTranslations } from 'next-intl'
import { Sparkles, Leaf, Wallet, FileCheck } from 'lucide-react'
import { AnimatedCounter } from '@/components/onboarding/AnimatedCounter'
import { Confetti } from '@/components/onboarding/Confetti'
import type { MomentWow } from '@/types/vida'

export function StepWow({ wow, name }: { wow: MomentWow; name: string }) {
  const t = useTranslations('onboarding')
  const firstName = name.split(' ')[0]

  return (
    <>
      <Confetti count={70} />
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">
            {t('progress', { step: 5, total: 5 })}
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('step5.title', { name: firstName })} <Sparkles className="inline text-amber-400" size={28} />
          </h1>
        </div>

        {/* Hero gain mensuel */}
        <div className="glass rounded-3xl p-6 space-y-2">
          <p className="text-sm text-white/55">{t('step5.subtitle')}</p>
          <p
            className="text-5xl md:text-6xl font-bold gradient-text-aurora"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <AnimatedCounter value={wow.gain_mensuel_estime_eur} suffix={t('step5.gainSuffix')} decimals={2} />
          </p>
          <p className="text-xs text-white/45">
            {t('step5.gainHint', { km: wow.km_propre_semaine })}
          </p>
        </div>

        {/* Triple KPI */}
        <div className="grid grid-cols-3 gap-3">
          <KpiTile
            icon={<Leaf size={18} />}
            color="emerald"
            value={
              <AnimatedCounter value={wow.co2_evite_mensuel_kg} suffix={t('step5.co2Suffix')} decimals={1} />
            }
            label={t('step5.co2Label')}
          />
          <KpiTile
            icon={<FileCheck size={18} />}
            color="cyan"
            value={<AnimatedCounter value={wow.aides_detectees_count} />}
            label={t('step5.aidesCountLabel')}
          />
          <KpiTile
            icon={<Wallet size={18} />}
            color="violet"
            value={<AnimatedCounter value={wow.aides_potentielles_eur} suffix={t('step5.aidesSuffix')} />}
            label={t('step5.aidesPotentielLabel')}
          />
        </div>

        {/* Première action */}
        <div className="glass rounded-2xl p-4 text-left">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-400/80 mb-1">{t('step5.premiereActionTitle')}</p>
          <p className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            {wow.premier_action.label}
          </p>
        </div>

        <p className="text-xs text-white/40">
          {t('step5.disclaimer')}
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
