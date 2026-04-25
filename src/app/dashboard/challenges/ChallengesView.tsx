'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Shield, TrendingUp, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice } from '@/lib/utils'
import { rangMultiplier } from '@/lib/rangs'
import type { ChallengeTemplate } from '@/lib/challenges'
import type { RangIdentity } from '@/types/vida'

type ChallengeRow = {
  id: string
  template_slug: string
  duration_days: number
  stake_amount_eur: number
  reward_target_eur: number
  status: string
  start_date: string
  end_date: string
  proofs_done: number
  proofs_required: number
  created_at: string
}

type PayoutRow = {
  id: string
  challenge_id: string
  outcome: string
  stake_returned_eur: number
  reward_won_eur: number
  trust_delta: number
  created_at: string
}

const RANG_CAP: Record<RangIdentity, number> = {
  explorateur: 25,
  gardien: 50,
  regenerateur: 100,
  legende: 200,
}

export function ChallengesView({
  templates,
  challenges,
  payouts,
  trustScore,
  trustLabel,
  rang,
}: {
  templates: ChallengeTemplate[]
  challenges: ChallengeRow[]
  payouts: PayoutRow[]
  trustScore: number
  trustLevel: string
  trustLabel: string
  rang: RangIdentity
}) {
  const router = useRouter()
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [stake, setStake] = useState<number>(0)
  const [starting, setStarting] = useState(false)

  const activeChallenge = challenges.find((c) => c.status === 'active')
  const completed = challenges.filter((c) => c.status !== 'active')
  const stakeCap = RANG_CAP[rang]
  const trustOk = trustScore >= 30

  const selectedTemplate = templates.find((t) => t.slug === selectedSlug) ?? null

  function pickTemplate(tpl: ChallengeTemplate) {
    setSelectedSlug(tpl.slug)
    setStake(Math.min(stakeCap, tpl.stake_min_eur))
  }

  async function startChallenge() {
    if (!selectedTemplate || stake <= 0) return
    setStarting(true)
    try {
      const r = await fetch('/api/challenges/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_slug: selectedTemplate.slug, stake_amount_eur: stake }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Erreur')
      toast.success('Challenge démarré 🔥')
      const challengeId = data?.challenge?.challenge_id
      if (challengeId) {
        router.push(`/dashboard/challenges/${challengeId}`)
      } else {
        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
      setStarting(false)
    }
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-white/60 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft size={18} />
            <span className="text-sm">Dashboard</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Challenges Stake
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-4xl mx-auto space-y-6">
          {/* Hero Trust + Rang */}
          <section className="glass rounded-3xl p-6 bg-gradient-to-br from-emerald-500/10 to-violet-500/10 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
                <Shield size={22} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold gradient-text-aurora" style={{ fontFamily: 'var(--font-display)' }}>
                  Mise &amp; preuve
                </h2>
                <p className="text-sm text-white/65 mt-1">
                  Tu mises sur toi-même. Tu fais le challenge. Tu récupères + une récompense. Sinon la mise est redistribuée.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3">
                <p className="text-xs uppercase tracking-wider text-white/45">Trust Score</p>
                <p className="text-2xl font-bold mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                  {trustScore} / 100
                </p>
                <p className="text-xs text-white/55 mt-0.5">{trustLabel}</p>
              </div>
              <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3">
                <p className="text-xs uppercase tracking-wider text-white/45">Rang · Mise max</p>
                <p className="text-2xl font-bold mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                  {formatPrice(stakeCap)}
                </p>
                <p className="text-xs text-white/55 mt-0.5">Bonus ×{rangMultiplier(rang).toFixed(1)} sur récompense</p>
              </div>
            </div>
          </section>

          {/* Challenge actif si présent */}
          {activeChallenge && (
            <section className="glass rounded-2xl p-5 space-y-3 border border-emerald-400/20 bg-emerald-500/5">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-300" />
                <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Challenge actif</h3>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{templates.find((t) => t.slug === activeChallenge.template_slug)?.title ?? activeChallenge.template_slug}</p>
                  <p className="text-xs text-white/55 mt-0.5">
                    {activeChallenge.proofs_done} / {activeChallenge.proofs_required} preuves · jusqu&apos;au {new Date(activeChallenge.end_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <Link
                  href={`/dashboard/challenges/${activeChallenge.id}`}
                  className="btn-primary"
                >
                  Continuer →
                </Link>
              </div>
              <div className="rounded-full bg-white/5 h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                  style={{ width: `${Math.min(100, (activeChallenge.proofs_done / activeChallenge.proofs_required) * 100)}%` }}
                />
              </div>
            </section>
          )}

          {/* Démarrer un nouveau challenge */}
          {!activeChallenge && (
            <>
              <section className="space-y-3">
                <h3 className="font-semibold text-white/80" style={{ fontFamily: 'var(--font-display)' }}>
                  Choisis ton challenge
                </h3>
                {!trustOk && (
                  <p className="text-sm text-amber-300 bg-amber-500/10 border border-amber-400/20 rounded-xl p-3">
                    Trust Score actuel {trustScore}/100 — il te faut au moins 30 pour staker. Continue à valider des trajets propres.
                  </p>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  {templates.map((tpl) => {
                    const overCap = tpl.stake_min_eur > stakeCap
                    return (
                      <button
                        key={tpl.slug}
                        onClick={() => !overCap && trustOk && pickTemplate(tpl)}
                        disabled={overCap || !trustOk}
                        className={`glass rounded-2xl p-4 text-left transition ${
                          selectedSlug === tpl.slug
                            ? 'border-emerald-400/50 bg-emerald-500/5'
                            : 'hover:border-white/20 disabled:opacity-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{tpl.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold">{tpl.title}</p>
                            <p className="text-xs text-white/55 mt-0.5">{tpl.duration_days}j · mise {tpl.stake_min_eur}-{tpl.stake_max_eur}€ · récompense {formatPrice(tpl.reward_target_eur)}</p>
                            <p className="text-xs text-white/45 mt-1.5">{tpl.description}</p>
                          </div>
                        </div>
                        {overCap && (
                          <p className="text-[11px] text-amber-300 mt-2">Mise min &gt; cap rang ({formatPrice(stakeCap)}) — monte de rang</p>
                        )}
                      </button>
                    )
                  })}
                </div>
              </section>

              {selectedTemplate && (
                <section className="glass rounded-2xl p-5 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                    <span className="text-lg">{selectedTemplate.emoji}</span>
                    {selectedTemplate.title}
                  </h4>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-white/45">Mise (€)</label>
                    <input
                      type="number"
                      value={stake}
                      onChange={(e) => setStake(Math.max(0, Math.round(Number(e.target.value))))}
                      min={selectedTemplate.stake_min_eur}
                      max={Math.min(stakeCap, selectedTemplate.stake_max_eur)}
                      step={5}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-base focus:border-emerald-400/40 focus:outline-none"
                    />
                    <p className="text-xs text-white/55">
                      Plage : {formatPrice(selectedTemplate.stake_min_eur)} — {formatPrice(Math.min(stakeCap, selectedTemplate.stake_max_eur))}
                    </p>
                  </div>
                  <ul className="text-xs text-white/55 space-y-1 list-disc list-inside">
                    {selectedTemplate.hints.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                  <button
                    onClick={startChallenge}
                    disabled={
                      starting ||
                      stake < selectedTemplate.stake_min_eur ||
                      stake > Math.min(stakeCap, selectedTemplate.stake_max_eur) ||
                      !trustOk
                    }
                    className="btn-primary w-full justify-center disabled:opacity-50"
                  >
                    {starting ? <Loader2 size={16} className="animate-spin" /> : <Trophy size={16} />}
                    Démarrer le challenge ({formatPrice(stake)})
                  </button>
                </section>
              )}
            </>
          )}

          {/* Historique payouts */}
          {payouts.length > 0 && (
            <section className="glass rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Historique</h3>
              <ul className="divide-y divide-white/5">
                {completed.slice(0, 10).map((c) => {
                  const payout = payouts.find((p) => p.challenge_id === c.id)
                  const tpl = templates.find((t) => t.slug === c.template_slug)
                  return (
                    <li key={c.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {tpl?.emoji} {tpl?.title ?? c.template_slug}
                        </p>
                        <p className="text-xs text-white/45">
                          {payout?.outcome === 'won' ? '✅ Gagné' : '❌ Perdu'} · mise {formatPrice(c.stake_amount_eur)}
                          {payout && payout.reward_won_eur > 0 && ` · +${formatPrice(payout.reward_won_eur)}`}
                          {payout && payout.trust_delta !== 0 && ` · Trust ${payout.trust_delta > 0 ? '+' : ''}${payout.trust_delta}`}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>
      </main>
    </>
  )
}
