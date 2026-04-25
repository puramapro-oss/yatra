'use client'

import { AMBIANCE_LABELS, AMBIANCE_MODES } from '@/lib/constants'
import type { AmbianceMode, PreferencesSensorielles } from '@/types/vida'

const AMBIANCE_EMOJI: Record<AmbianceMode, string> = {
  foret: '🌲',
  pluie: '🌧️',
  ocean: '🌊',
  feu: '🔥',
  temple_futuriste: '🛸',
  silence_sacre: '✨',
}

export function StepPreferences({
  preferences,
  setPreferences,
}: {
  preferences: PreferencesSensorielles
  setPreferences: (p: PreferencesSensorielles) => void
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">Étape 3 / 5</p>
        <h1
          className="text-3xl md:text-4xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Ton ambiance
        </h1>
        <p className="text-sm text-white/55">
          Choisis ton décor sensoriel par défaut.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {AMBIANCE_MODES.map((m) => {
          const active = preferences.ambiance_preferee === m
          return (
            <button
              key={m}
              type="button"
              onClick={() => setPreferences({ ...preferences, ambiance_preferee: m })}
              aria-pressed={active}
              className={`flex items-center gap-3 rounded-xl py-3 px-4 border text-sm transition ${
                active
                  ? 'bg-emerald-500/15 border-emerald-400/60 text-white'
                  : 'bg-white/5 border-white/10 text-white/65 hover:bg-white/8'
              }`}
            >
              <span className="text-2xl leading-none">{AMBIANCE_EMOJI[m]}</span>
              <span className="leading-tight">{AMBIANCE_LABELS[m]}</span>
            </button>
          )
        })}
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <ToggleRow
          label="Sons binauraux subtils pendant les trajets"
          checked={preferences.binaural_enabled}
          onChange={(b) => setPreferences({ ...preferences, binaural_enabled: b })}
        />
        <ToggleRow
          label="Vibrations haptiques (validations, succès)"
          checked={preferences.haptique_enabled}
          onChange={(b) => setPreferences({ ...preferences, haptique_enabled: b })}
        />
      </div>

      <div>
        <span className="text-xs font-medium text-white/65 mb-2 block">Voix d&apos;Aria</span>
        <div className="grid grid-cols-3 gap-2">
          {(['douce', 'energique', 'silencieuse'] as const).map((v) => {
            const active = preferences.voix_aria === v
            return (
              <button
                key={v}
                type="button"
                onClick={() => setPreferences({ ...preferences, voix_aria: v })}
                aria-pressed={active}
                className={`text-xs rounded-xl py-2.5 border capitalize transition ${
                  active
                    ? 'bg-cyan-500/15 border-cyan-400/60 text-white'
                    : 'bg-white/5 border-white/10 text-white/65 hover:bg-white/8'
                }`}
              >
                {v === 'energique' ? 'énergique' : v}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between glass rounded-xl px-4 py-3 hover:bg-white/[0.06] transition"
    >
      <span className="text-sm text-white/85">{label}</span>
      <span
        className={`relative w-10 h-6 rounded-full transition-colors ${
          checked ? 'bg-emerald-500' : 'bg-white/15'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </span>
    </button>
  )
}
