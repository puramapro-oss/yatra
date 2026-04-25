'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, Clock, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice } from '@/lib/utils'
import type { ChallengeTemplate, ChallengeProgress } from '@/lib/challenges'

type Challenge = {
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
  trust_score_at_start: number
  jackpot_eur: number | null
  created_at: string
}

type Day = {
  id: string
  day_index: number
  day_date: string
  proof_type: string
  proof_value: Record<string, unknown> | null
  validated: boolean
  validated_at: string | null
  fraud_score: number | null
}

type Payout = {
  id: string
  outcome: string
  stake_returned_eur: number
  reward_won_eur: number
  jackpot_won_eur: number
  trust_delta: number
  created_at: string
}

export function ChallengeDetailView({
  challenge,
  template,
  days,
  payout,
  progress,
}: {
  challenge: Challenge
  template: ChallengeTemplate | null
  days: Day[]
  payout: Payout | null
  progress: ChallengeProgress
}) {
  const router = useRouter()
  const [submittingDay, setSubmittingDay] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  const [tripIdInput, setTripIdInput] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [noteInput, setNoteInput] = useState('')

  const today = new Date().toISOString().slice(0, 10)
  const todayDay = days.find((d) => d.day_date === today)
  const proofType = template?.proof_type ?? 'self_declared'

  async function submitProof() {
    if (challenge.status !== 'active') return
    setSubmittingDay(today)
    try {
      const body: Record<string, string | undefined> = { day_date: today, note: noteInput || undefined }
      if (proofType === 'trip_clean') {
        if (!tripIdInput) {
          toast.error('Choisis un trip_id')
          setSubmittingDay(null)
          return
        }
        body.trip_id = tripIdInput
      } else if (proofType === 'photo_code') {
        if (!codeInput || codeInput.length < 2) {
          toast.error('Code requis (min 2 chars)')
          setSubmittingDay(null)
          return
        }
        body.code = codeInput
      }
      const r = await fetch(`/api/challenges/stake/${challenge.id}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Erreur')
      toast.success('Preuve validée ✨')
      setTripIdInput('')
      setCodeInput('')
      setNoteInput('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSubmittingDay(null)
    }
  }

  async function completeChallenge() {
    setCompleting(true)
    try {
      const r = await fetch(`/api/challenges/stake/${challenge.id}/complete`, {
        method: 'POST',
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Erreur')
      if (data?.outcome === 'won') {
        toast.success('🎉 Challenge réussi ! Récompense créditée')
      } else {
        toast.message('Challenge échoué — la mise est redistribuée')
      }
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
      setCompleting(false)
    }
  }

  const canComplete = challenge.status === 'active' && new Date(challenge.end_date) <= new Date()

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard/challenges" className="text-white/60 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft size={18} />
            <span className="text-sm">Challenges</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            {template?.emoji} {template?.title ?? challenge.template_slug}
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-6">
          {/* Hero progression */}
          <section className="glass rounded-3xl p-6 bg-gradient-to-br from-emerald-500/10 to-violet-500/10 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3">
                <p className="text-xs uppercase tracking-wider text-white/45">Mise</p>
                <p className="text-2xl font-bold mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                  {formatPrice(challenge.stake_amount_eur)}
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3">
                <p className="text-xs uppercase tracking-wider text-white/45">Récompense potentielle</p>
                <p className="text-2xl font-bold mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                  +{formatPrice(challenge.reward_target_eur)}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-white/65">{challenge.proofs_done} / {challenge.proofs_required} preuves</span>
                <span className={progress.on_track ? 'text-emerald-300' : 'text-amber-300'}>
                  {progress.on_track ? 'Sur la bonne voie' : 'Rattrape ton retard'}
                </span>
              </div>
              <div className="rounded-full bg-white/5 h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                  style={{ width: `${Math.min(100, (challenge.proofs_done / challenge.proofs_required) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-white/45 mt-2">
                <Clock size={12} className="inline mr-1" />
                {progress.days_remaining} jour(s) restant(s) · jusqu&apos;au {new Date(challenge.end_date).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </section>

          {/* Si terminé : payout */}
          {payout && (
            <section className={`glass rounded-2xl p-5 space-y-2 border ${payout.outcome === 'won' ? 'border-emerald-400/30' : 'border-red-400/20'}`}>
              <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                {payout.outcome === 'won' ? '🎉 Réussi' : 'Terminé · échec'}
              </h3>
              <p className="text-sm text-white/65">
                Mise rendue : {formatPrice(payout.stake_returned_eur)} · récompense : {formatPrice(payout.reward_won_eur)}
                {payout.trust_delta !== 0 && ` · Trust ${payout.trust_delta > 0 ? '+' : ''}${payout.trust_delta}`}
              </p>
            </section>
          )}

          {/* Si actif et arrivé à terme : bouton clôturer */}
          {canComplete && (
            <button
              onClick={completeChallenge}
              disabled={completing}
              className="btn-primary w-full justify-center"
            >
              {completing ? <Loader2 size={16} className="animate-spin" /> : null}
              Clôturer le challenge maintenant
            </button>
          )}

          {/* Soumettre preuve aujourd'hui */}
          {challenge.status === 'active' && todayDay && !todayDay.validated && (
            <section className="glass rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Preuve d&apos;aujourd&apos;hui</h3>
              {proofType === 'trip_clean' && (
                <>
                  <label className="text-xs uppercase tracking-wider text-white/45">ID du trajet validé</label>
                  <input
                    type="text"
                    value={tripIdInput}
                    onChange={(e) => setTripIdInput(e.target.value)}
                    placeholder="UUID du trajet"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-sm focus:border-emerald-400/40 focus:outline-none font-mono"
                  />
                  <p className="text-xs text-white/45">
                    Va sur <Link href="/dashboard/trajets" className="text-emerald-300 underline">Mes trajets</Link>, copie l&apos;ID d&apos;un trajet completed du jour
                    {template?.required_modes && ` · modes acceptés : ${template.required_modes.join(', ')}`}
                  </p>
                </>
              )}
              {proofType === 'photo_code' && (
                <>
                  <label className="text-xs uppercase tracking-wider text-white/45">Code preuve</label>
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="PURA-XX"
                    maxLength={20}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-sm focus:border-emerald-400/40 focus:outline-none font-mono"
                  />
                </>
              )}
              <label className="text-xs uppercase tracking-wider text-white/45">Note (facultatif)</label>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Ce que tu retiens de ta journée…"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-sm focus:border-emerald-400/40 focus:outline-none"
              />
              <button
                onClick={submitProof}
                disabled={submittingDay !== null}
                className="btn-primary w-full justify-center"
              >
                {submittingDay ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Valider ma preuve
              </button>
            </section>
          )}

          {/* Timeline jours */}
          <section className="glass rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Timeline ({challenge.duration_days} jours)</h3>
            <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
              {days.map((d) => {
                const isToday = d.day_date === today
                const isPast = new Date(d.day_date) < new Date(today)
                return (
                  <div
                    key={d.id}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs gap-0.5 border ${
                      d.validated
                        ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200'
                        : isToday
                          ? 'bg-violet-500/10 border-violet-400/30 text-violet-200'
                          : isPast
                            ? 'bg-red-500/10 border-red-400/15 text-red-300/70'
                            : 'bg-white/[0.03] border-white/5 text-white/40'
                    }`}
                  >
                    {d.validated ? <Check size={14} /> : isPast ? <X size={14} /> : null}
                    <span className="font-mono">{d.day_index}</span>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-white/45">
              ✅ validé · 🟪 aujourd&apos;hui · ❌ raté · — à venir
            </p>
          </section>
        </div>
      </main>
    </>
  )
}
