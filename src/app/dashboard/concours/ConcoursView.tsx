'use client'

import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice } from '@/lib/utils'
import { CONTEST_EMOJI, CONTEST_LABELS, type ContestType } from '@/lib/contests'

type Winner = {
  user_id: string
  rank: number
  amount_eur: number
  score?: number
  tickets?: number
}

type Result = {
  id: string
  type: string
  period_start: string
  period_end: string
  total_pool_eur: number
  winners: Winner[]
  total_distributed_eur: number
  created_at: string
}

type Pool = {
  pool_type: string
  balance_eur: number
}

export function ConcoursView({
  results,
  pools,
  myUserId,
}: {
  results: Result[]
  pools: Pool[]
  myUserId: string
}) {
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
            Concours · résultats
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-6">
          <section className="glass rounded-3xl p-6 bg-gradient-to-br from-violet-500/10 to-amber-500/10 space-y-3">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/15 text-violet-300 flex items-center justify-center">
                <Sparkles size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-bold gradient-text-aurora" style={{ fontFamily: 'var(--font-display)' }}>
                  20% du CA redistribué
                </h2>
                <p className="text-sm text-white/65 mt-1">
                  6% classement hebdo · 4% tirage mensuel · 10% Association Purama. CRONs autonomes dimanche 23:59 + dernier jour mois 23:59.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {pools.filter((p) => ['reward', 'jackpot_lottery'].includes(p.pool_type)).map((p) => (
                <div key={p.pool_type} className="rounded-xl bg-white/[0.04] border border-white/5 p-3">
                  <p className="text-xs uppercase tracking-wider text-white/45">{p.pool_type === 'reward' ? 'Pool reward' : 'Jackpot loterie'}</p>
                  <p className="text-2xl font-bold mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                    {formatPrice(Number(p.balance_eur))}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {results.length === 0 ? (
            <section className="glass rounded-2xl p-5">
              <p className="text-sm text-white/65 text-center py-6">
                Pas encore de résultats. Premier classement dimanche 23:59 UTC.
              </p>
            </section>
          ) : (
            <section className="space-y-4">
              {results.map((r) => {
                const type = r.type as ContestType
                const myPlace = r.winners.find((w) => w.user_id === myUserId)
                return (
                  <article key={r.id} className="glass rounded-2xl p-5 space-y-3">
                    <header className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                        <span className="text-xl">{CONTEST_EMOJI[type] ?? '🏆'}</span>
                        {CONTEST_LABELS[type] ?? type}
                      </h3>
                      <span className="text-xs text-white/45">
                        {new Date(r.period_start).toLocaleDateString('fr-FR')} → {new Date(r.period_end).toLocaleDateString('fr-FR')}
                      </span>
                    </header>
                    <p className="text-xs text-white/55">
                      Pool {formatPrice(Number(r.total_pool_eur))} · distribué {formatPrice(Number(r.total_distributed_eur))} · {r.winners.length} gagnants
                    </p>
                    {myPlace && (
                      <p className="text-sm bg-emerald-500/10 border border-emerald-400/20 rounded-xl p-3">
                        🎉 Toi : <strong>#{myPlace.rank}</strong> · {formatPrice(Number(myPlace.amount_eur))}
                      </p>
                    )}
                    <ul className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                      {r.winners.slice(0, 10).map((w) => (
                        <li
                          key={`${r.id}-${w.user_id}`}
                          className={`rounded-lg p-2 text-center border ${
                            w.user_id === myUserId
                              ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-100'
                              : 'bg-white/[0.04] border-white/5 text-white/65'
                          }`}
                        >
                          <p className="font-mono text-[10px] uppercase tracking-wider opacity-70">
                            {w.rank === 1 ? '🥇' : w.rank === 2 ? '🥈' : w.rank === 3 ? '🥉' : `#${w.rank}`}
                          </p>
                          <p className="font-semibold tabular-nums mt-0.5">{formatPrice(Number(w.amount_eur))}</p>
                        </li>
                      ))}
                    </ul>
                  </article>
                )
              })}
            </section>
          )}
        </div>
      </main>
    </>
  )
}
