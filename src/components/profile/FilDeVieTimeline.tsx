'use client'

import { useEffect, useState } from 'react'
import { Loader2, Sparkles, Lock } from 'lucide-react'
import type { FilDeVieEventType, FilDeVieEvent } from '@/types/vida'
import { formatRelativeDate } from '@/lib/utils'

const EVENT_LABELS: Record<FilDeVieEventType, { icon: string; label: string }> = {
  signup: { icon: '🌱', label: 'Tu as rejoint YATRA' },
  onboarding_started: { icon: '🚀', label: 'Tu as commencé ton onboarding' },
  onboarding_completed: { icon: '✨', label: 'Onboarding terminé — Voyageur prêt' },
  first_clean_trip: { icon: '🚲', label: 'Premier trajet propre' },
  first_credit: { icon: '💰', label: 'Premier Vida Credit gagné' },
  first_referral: { icon: '🤝', label: 'Premier filleul actif' },
  first_aide_activated: { icon: '📜', label: 'Première aide activée' },
  rang_changed: { icon: '⭐', label: 'Changement de rang' },
  mission_completed: { icon: '🎯', label: 'Mission validée' },
  voyage_humanitaire: { icon: '❤️', label: 'Voyage humanitaire' },
  first_withdrawal: { icon: '💸', label: 'Premier retrait wallet' },
  streak_milestone: { icon: '🔥', label: 'Palier de streak atteint' },
  concours_top10: { icon: '🏆', label: 'Top 10 concours' },
  tirage_winner: { icon: '🎰', label: 'Gagnant du tirage' },
}

export function FilDeVieTimeline() {
  const [events, setEvents] = useState<FilDeVieEvent[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/vida/fil-de-vie')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d.error) setError(d.error)
        else setEvents(d.events ?? [])
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur réseau')
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return <p className="text-sm text-amber-400/80">{error}</p>
  }

  if (events === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/55">
        <Loader2 className="animate-spin" size={16} /> Chargement de ton fil de vie…
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-sm text-white/55 flex items-center gap-2">
        <Sparkles size={16} className="text-emerald-400" /> Ton premier événement arrive bientôt.
      </div>
    )
  }

  return (
    <ol className="space-y-3">
      {events.map((e) => {
        const meta = EVENT_LABELS[e.event_type as FilDeVieEventType]
        const fallback = { icon: '•', label: e.event_type }
        const m = meta ?? fallback
        return (
          <li key={e.id} className="flex items-start gap-3">
            <span className="text-2xl leading-none mt-0.5" aria-hidden>
              {m.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{m.label}</p>
              <p className="text-xs text-white/45 flex items-center gap-1.5">
                {formatRelativeDate(e.created_at)}
                {e.irreversible && (
                  <span className="flex items-center gap-0.5 text-[10px] uppercase tracking-wider text-white/35">
                    <Lock size={9} /> Inaltérable
                  </span>
                )}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
