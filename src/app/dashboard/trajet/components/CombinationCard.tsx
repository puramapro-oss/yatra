'use client'

import { Loader2, EuroIcon, Clock, Leaf, Sparkles, Wind } from 'lucide-react'
import { MOBILITY_LABELS, MOBILITY_EMOJI } from '@/types/vida'
import type { RouteCombination } from '@/types/trip'
import { Tag } from './Tag'
import { Stat } from './Stat'

interface CombinationCardProps {
  combo: RouteCombination
  rank: number
  sortBy: 'prix' | 'duree' | 'co2' | 'points'
  onStart: () => void
  starting: boolean
  disabled: boolean
}

export function CombinationCard({
  combo,
  rank,
  sortBy,
  onStart,
  starting,
  disabled,
}: CombinationCardProps) {
  const isClean = combo.tags.includes('cleanest')
  const isCheap = combo.tags.includes('cheapest')
  const isApais = combo.tags.includes('apaisant')

  const highlightMap = {
    prix: 0,
    duree: 1,
    co2: 2,
    points: 3,
  }
  const highlightIndex = highlightMap[sortBy]

  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-3 hover:border-emerald-400/30 transition relative">
      {rank === 1 && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-amber-500 text-black text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shadow-lg">
          ⭐ N°1
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{MOBILITY_EMOJI[combo.mode_dominant]}</span>
          <h3 className="font-semibold text-sm leading-tight">{combo.label}</h3>
        </div>
        <div className="flex flex-wrap gap-1 justify-end">
          {isCheap && <Tag color="amber">💸 Moins cher</Tag>}
          {isClean && <Tag color="emerald">🌿 Plus propre</Tag>}
          {isApais && <Tag color="violet">🧘 Apaisant</Tag>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat
          icon={<EuroIcon size={12} />}
          label="Coût"
          value={`${combo.cost_eur.toFixed(2)} €`}
          highlight={highlightIndex === 0}
        />
        <Stat
          icon={<Clock size={12} />}
          label="Durée"
          value={`${Math.round(combo.duration_min)} min`}
          highlight={highlightIndex === 1}
        />
        <Stat
          icon={<Leaf size={12} />}
          label="CO₂ évité"
          value={`${combo.co2_avoided_kg.toFixed(2)} kg`}
          highlight={highlightIndex === 2}
        />
        <Stat
          icon={<Sparkles size={12} />}
          label="Tu gagnes"
          value={combo.gain_credits_eur > 0 ? `+ ${combo.gain_credits_eur.toFixed(2)} €` : '—'}
          highlight={highlightIndex === 3 && combo.gain_credits_eur > 0}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-white/35">
          <Wind size={11} className="inline mr-1" />
          Apaisement {combo.apaisement_score.toFixed(1)}/10
        </span>
        <button
          type="button"
          onClick={onStart}
          disabled={disabled || starting}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-black text-xs font-semibold disabled:opacity-50 hover:scale-[1.02] active:scale-95 transition"
        >
          {starting ? <Loader2 className="animate-spin inline" size={12} /> : 'Démarrer'}
        </button>
      </div>

      {combo.steps.length > 1 && (
        <div className="border-t border-white/5 pt-2 flex flex-wrap gap-1.5 text-[10px] text-white/45">
          {combo.steps.map((s, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded bg-white/5">
              {MOBILITY_EMOJI[s.mode]} {MOBILITY_LABELS[s.mode]} {s.distance_km}km
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
