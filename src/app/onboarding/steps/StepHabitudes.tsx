'use client'

import { useTranslations } from 'next-intl'
import type { HabitudesMobilite, MobilityMode } from '@/types/vida'
import { MOBILITY_LABELS, MOBILITY_EMOJI } from '@/types/vida'

const ALL_MODES: MobilityMode[] = [
  'marche',
  'velo',
  'trottinette',
  'transport_public',
  'covoiturage',
  'train',
  'voiture_perso',
  'avion',
]

export function StepHabitudes({
  name,
  ville,
  setVille,
  habitudes,
  setHabitudes,
}: {
  name: string
  ville: string
  setVille: (v: string) => void
  habitudes: HabitudesMobilite
  setHabitudes: (h: HabitudesMobilite) => void
}) {
  const t = useTranslations('onboarding')
  const firstName = name.split(' ')[0]

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">
          {t('progress', { step: 2, total: 5 })}
        </p>
        <h1
          className="text-3xl md:text-4xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {name ? t('step2.title', { name: firstName }) : t('step2.titleFallback')}
        </h1>
        <p className="text-sm text-white/55">
          {t('step2.subtitle')}
        </p>
      </div>

      {/* Ville */}
      <label className="block">
        <span className="text-xs font-medium text-white/65 mb-1.5 block">{t('step2.villeLabel')}</span>
        <input
          type="text"
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          placeholder={t('step2.villePlaceholder')}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-400/60 outline-none transition"
        />
      </label>

      {/* Mode dominant */}
      <div>
        <span className="text-xs font-medium text-white/65 mb-2 block">{t('step2.modeDominantLabel')}</span>
        <div className="grid grid-cols-4 gap-2">
          {ALL_MODES.map((m) => {
            const active = habitudes.mode_dominant === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => setHabitudes({ ...habitudes, mode_dominant: m })}
                aria-pressed={active}
                className={`flex flex-col items-center gap-1 rounded-xl py-3 px-2 border text-xs transition ${
                  active
                    ? 'bg-emerald-500/15 border-emerald-400/60 text-white'
                    : 'bg-white/5 border-white/10 text-white/65 hover:bg-white/8'
                }`}
              >
                <span className="text-2xl leading-none">{MOBILITY_EMOJI[m]}</span>
                <span className="leading-tight text-center">{MOBILITY_LABELS[m]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* km/sem propre */}
      <label className="block">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-white/65">{t('step2.kmPropreLabel')}</span>
          <span className="text-sm font-semibold text-emerald-400">{habitudes.km_propre_semaine} km</span>
        </div>
        <input
          type="range"
          min={0}
          max={300}
          step={5}
          value={habitudes.km_propre_semaine}
          onChange={(e) =>
            setHabitudes({ ...habitudes, km_propre_semaine: parseInt(e.target.value, 10) })
          }
          className="w-full accent-emerald-400"
        />
      </label>

      {/* km/sem carbone */}
      <label className="block">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-white/65">{t('step2.kmCarboneLabel')}</span>
          <span className="text-sm font-semibold text-amber-400">{habitudes.km_carbone_semaine} km</span>
        </div>
        <input
          type="range"
          min={0}
          max={500}
          step={10}
          value={habitudes.km_carbone_semaine}
          onChange={(e) =>
            setHabitudes({ ...habitudes, km_carbone_semaine: parseInt(e.target.value, 10) })
          }
          className="w-full accent-amber-400"
        />
      </label>
    </div>
  )
}
