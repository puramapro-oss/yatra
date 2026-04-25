'use client'

import Link from 'next/link'
import { ArrowLeft, Trophy } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice } from '@/lib/utils'
import { weeklyDistribution } from '@/lib/contests'

type Entry = {
  user_id: string
  score: number
  tickets: number
  profiles: { full_name: string | null } | { full_name: string | null }[]
}

export function ClassementView({
  period,
  poolBalanceEur,
  entries,
  myUserId,
  myPosition,
  myEntry,
}: {
  period: { start: string; end: string }
  poolBalanceEur: number
  entries: Entry[]
  myUserId: string
  myPosition: number | null
  myEntry: { score: number; tickets: number; eligible: boolean }
}) {
  const distributable = Math.min(poolBalanceEur, 10000)

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-white/60 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft size={18} />
            <span className="text-sm">Dashboard</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Classement hebdo
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-6">
          <section className="glass rounded-3xl p-6 bg-gradient-to-br from-amber-500/10 to-violet-500/10 space-y-3">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
                <Trophy size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-bold gradient-text-aurora" style={{ fontFamily: 'var(--font-display)' }}>
                  Top 10 = 6% du CA
                </h2>
                <p className="text-sm text-white/65 mt-1">
                  Période en cours : {new Date(period.start).toLocaleDateString('fr-FR')} → {new Date(period.end).toLocaleDateString('fr-FR')}
                  {' · '}
                  Pool reward : <strong>{formatPrice(distributable)}</strong>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <Mini label="Ma position" value={myPosition ? `#${myPosition}` : '—'} />
              <Mini label="Mon score" value={myEntry.score.toFixed(0)} />
              <Mini label="Mes tickets" value={myEntry.tickets.toString()} />
            </div>
          </section>

          <section className="glass rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Top 100</h3>
            {entries.length === 0 ? (
              <p className="text-sm text-white/55">Pas encore de classement cette semaine. Sois le 1er 🚀</p>
            ) : (
              <ul className="divide-y divide-white/5">
                {entries.map((e, idx) => {
                  const rank = idx + 1
                  const isMe = e.user_id === myUserId
                  const p = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles
                  const reward = rank <= 10 ? weeklyDistribution(rank, distributable) : 0
                  return (
                    <li
                      key={e.user_id}
                      className={`py-3 flex items-center justify-between gap-3 ${isMe ? 'bg-emerald-500/5 -mx-2 px-2 rounded-lg' : ''}`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className={`text-sm font-mono w-8 text-right ${rank <= 3 ? 'text-amber-300' : 'text-white/45'}`}>
                          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                        </span>
                        <p className="font-medium truncate text-sm">
                          {p?.full_name ?? '—'}
                          {isMe && <span className="ml-2 text-xs text-emerald-300">· toi</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold tabular-nums">{Math.round(e.score)}</p>
                        {reward > 0 && (
                          <p className="text-[11px] text-emerald-300">+{formatPrice(reward)}</p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="glass rounded-2xl p-5 space-y-2 text-sm text-white/65">
            <h3 className="font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Comment monter ?</h3>
            <ul className="space-y-1 text-xs list-disc list-inside">
              <li>Trajet propre validé : +5 pts</li>
              <li>Parrainage actif : +10 pts</li>
              <li>Jour actif (trip OU msg Aria) : +5 pts</li>
              <li>Top 10 dimanche 23:59 UTC = redistribution auto wallet</li>
            </ul>
          </section>
        </div>
      </main>
    </>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-white/45">{label}</p>
      <p className="text-xl font-bold mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
    </div>
  )
}
