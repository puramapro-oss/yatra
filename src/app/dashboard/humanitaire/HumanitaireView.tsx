'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, Globe, MapPin, Users } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import type { HumanitarianMatch } from '@/lib/humanitarian-matcher'

const CAUSE_EMOJI: Record<string, string> = {
  climat: '🌱',
  social: '🤝',
  education: '📚',
  sante: '⚕️',
  biodiversite: '🐝',
  urgence: '🚨',
}

const CAUSE_LABEL: Record<string, string> = {
  climat: 'Climat',
  social: 'Solidarité',
  education: 'Éducation',
  sante: 'Santé',
  biodiversite: 'Biodiversité',
  urgence: 'Urgence',
}

type AppLite = {
  id: string
  mission_id: string
  status: string
  applied_at: string
}

export function HumanitaireView({
  matches,
  applications,
}: {
  matches: HumanitarianMatch[]
  applications: AppLite[]
}) {
  const [activeCause, setActiveCause] = useState<string | 'all'>('all')

  const causes = useMemo(() => {
    const set = new Set(matches.map((m) => m.mission.cause))
    return ['all', ...Array.from(set)]
  }, [matches])

  const filtered = useMemo(() => {
    if (activeCause === 'all') return matches
    return matches.filter((m) => m.mission.cause === activeCause)
  }, [matches, activeCause])

  const myApps = new Map<string, AppLite>()
  for (const a of applications) myApps.set(a.mission_id, a)

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-5xl mx-auto flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-white/60 hover:text-white transition flex items-center gap-1.5"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Dashboard</span>
          </Link>
          <h1
            className="ml-2 text-lg font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Voyages humanitaires
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-5xl mx-auto space-y-6">
          {/* Hero */}
          <section className="glass rounded-3xl p-6 bg-gradient-to-br from-emerald-500/10 to-violet-500/10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/15 text-violet-300 flex items-center justify-center">
                <Globe size={22} />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-white/45">VIDA Assoc</p>
                <h2
                  className="text-xl font-bold mt-0.5 gradient-text-aurora"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Donne du sens à tes trajets
                </h2>
                <p className="text-sm text-white/55 mt-1">
                  {matches.length} mission{matches.length > 1 ? 's' : ''} sélectionnée{matches.length > 1 ? 's' : ''} pour toi.
                  Train réduit jusqu'à -100%, hébergement souvent inclus.
                </p>
              </div>
            </div>
          </section>

          {/* Causes */}
          <section className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 scrollbar-none">
            {causes.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCause(c)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm transition border ${
                  activeCause === c
                    ? 'bg-violet-500/20 border-violet-400/40 text-violet-200'
                    : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white'
                }`}
              >
                {c === 'all' ? 'Toutes' : `${CAUSE_EMOJI[c] ?? ''} ${CAUSE_LABEL[c] ?? c}`}
              </button>
            ))}
          </section>

          {/* Cards */}
          {filtered.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-white/55">
              Aucune mission dans cette cause pour le moment.
            </div>
          ) : (
            <section className="grid sm:grid-cols-2 gap-4">
              {filtered.map((m) => {
                const application = myApps.get(m.mission.id)
                return (
                  <Link
                    key={m.mission.id}
                    href={`/dashboard/humanitaire/${m.mission.slug}`}
                    className="glass rounded-2xl p-5 flex flex-col gap-3 hover:border-violet-400/30 transition group"
                  >
                    <header className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center text-2xl">
                        {CAUSE_EMOJI[m.mission.cause] ?? '🌍'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-semibold tracking-tight"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {m.mission.title}
                        </h3>
                        <p className="text-xs text-white/45 mt-0.5 truncate">
                          {m.mission.ngo_name}
                        </p>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-violet-200 bg-violet-500/10 border border-violet-400/20 px-2 py-1 rounded-full whitespace-nowrap">
                        Score {m.score}
                      </span>
                    </header>

                    <p className="text-sm text-white/65 leading-snug line-clamp-2">
                      {m.mission.description}
                    </p>

                    <div className="flex flex-wrap gap-3 text-xs text-white/55">
                      {m.mission.destination_city && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {m.mission.destination_city}
                        </span>
                      )}
                      {m.mission.duration_days && (
                        <span>📅 {m.mission.duration_days}j</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {m.spots_left}/{m.mission.spots_total}
                      </span>
                      <span className="text-emerald-300">
                        🚄 -{m.mission.transport_discount_pct}%
                      </span>
                    </div>

                    {application && (
                      <span className={`text-xs font-medium ${
                        application.status === 'accepted'
                          ? 'text-emerald-300'
                          : application.status === 'declined' || application.status === 'withdrawn'
                          ? 'text-white/40'
                          : 'text-violet-200'
                      }`}>
                        Candidature : {application.status}
                      </span>
                    )}

                    {m.reasons.length > 0 && !application && (
                      <ul className="text-xs text-white/45 space-y-0.5">
                        {m.reasons.slice(0, 2).map((r, i) => (
                          <li key={i}>• {r}</li>
                        ))}
                      </ul>
                    )}
                  </Link>
                )
              })}
            </section>
          )}
        </div>
      </main>
    </>
  )
}
