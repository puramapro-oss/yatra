'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import type { CrossPromo } from '@/lib/cross-promo'

export function CrossPromoBanner() {
  const [promos, setPromos] = useState<CrossPromo[]>([])
  const trackedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    let alive = true
    fetch('/api/cross-promo?count=2')
      .then((r) => r.ok ? r.json() : { promos: [] })
      .then((d) => {
        if (alive) setPromos((d?.promos ?? []) as CrossPromo[])
      })
      .catch(() => {
        // silencieux
      })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (promos.length === 0) return
    if (typeof navigator === 'undefined' || !navigator.sendBeacon) return
    for (const p of promos) {
      if (trackedRef.current.has(p.id)) continue
      try {
        navigator.sendBeacon(
          '/api/cross-promo/track',
          new Blob([JSON.stringify({ promo_id: p.id, type: 'view' })], { type: 'application/json' }),
        )
        trackedRef.current.add(p.id)
      } catch {
        // ignore
      }
    }
  }, [promos])

  function handleClick(promoId: string) {
    if (typeof navigator === 'undefined' || !navigator.sendBeacon) return
    try {
      navigator.sendBeacon(
        '/api/cross-promo/track',
        new Blob([JSON.stringify({ promo_id: promoId, type: 'click' })], { type: 'application/json' }),
      )
    } catch {
      // ignore
    }
  }

  if (promos.length === 0) return null

  return (
    <section className="space-y-3" aria-label="Découvre l'écosystème Purama">
      <p className="text-xs uppercase tracking-wider text-white/40">L&apos;écosystème Purama</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {promos.map((p) => (
          <a
            key={p.id}
            href={p.deeplink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleClick(p.id)}
            className="glass rounded-2xl p-4 hover:border-emerald-400/30 transition group flex items-start gap-3"
          >
            <span className="text-2xl shrink-0">{p.emoji ?? '✨'}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                {p.headline}
              </p>
              <p className="text-xs text-white/55 mt-0.5">{p.body}</p>
              <p className="text-xs text-emerald-300 mt-1.5 inline-flex items-center gap-1">
                {p.cta_label} <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
