'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Loader2, MapPin, Calendar, Users } from 'lucide-react'
import { toast } from 'sonner'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'

const CAUSE_EMOJI: Record<string, string> = {
  climat: '🌱',
  social: '🤝',
  education: '📚',
  sante: '⚕️',
  biodiversite: '🐝',
  urgence: '🚨',
}

type Mission = {
  id: string
  slug: string
  title: string
  ngo_name: string
  ngo_url: string | null
  cause: string
  destination_city: string | null
  destination_country: string
  description: string
  duration_days: number | null
  starts_at: string | null
  ends_at: string | null
  spots_total: number
  spots_taken: number
  cost_eur: number
  transport_discount_pct: number
  required_age_min: number | null
  prerequisites: string | null
  contact_email: string | null
}

type Application = {
  id: string
  status: string
  applied_at: string
  motivation: string
} | null

export function MissionDetailView({
  mission,
  application,
  spotsLeft,
}: {
  mission: Mission
  application: Application
  spotsLeft: number
}) {
  const router = useRouter()
  const [motivation, setMotivation] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isFull = spotsLeft <= 0
  const valid = motivation.trim().length >= 50

  async function handleApply() {
    if (!valid) return
    setSubmitting(true)
    try {
      const r = await fetch(`/api/humanitarian/${mission.slug}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivation: motivation.trim() }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Erreur')
      toast.success('Candidature envoyée 🎉')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleWithdraw() {
    if (!confirm('Retirer ta candidature ?')) return
    setSubmitting(true)
    try {
      const r = await fetch(`/api/humanitarian/${mission.slug}/apply`, {
        method: 'DELETE',
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Erreur')
      toast.success('Candidature retirée')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-3xl mx-auto flex items-center gap-3">
          <Link
            href="/dashboard/humanitaire"
            className="text-white/60 hover:text-white transition flex items-center gap-1.5"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Retour</span>
          </Link>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-5">
          {/* Hero */}
          <section className="glass rounded-3xl p-6 bg-gradient-to-br from-emerald-500/10 to-violet-500/10">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/15 text-2xl flex items-center justify-center">
                {CAUSE_EMOJI[mission.cause] ?? '🌍'}
              </div>
              <div className="flex-1 min-w-0">
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {mission.title}
                </h1>
                <p className="text-sm text-white/55 mt-1">
                  {mission.ngo_url ? (
                    <a
                      href={mission.ngo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white inline-flex items-center gap-1"
                    >
                      {mission.ngo_name} <ExternalLink size={12} />
                    </a>
                  ) : (
                    mission.ngo_name
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-5 text-sm text-white/65">
              {mission.destination_city && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} /> {mission.destination_city}
                </span>
              )}
              {mission.duration_days && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} /> {mission.duration_days} jours
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users size={14} /> {spotsLeft}/{mission.spots_total} places
              </span>
              <span className="flex items-center gap-1.5 text-emerald-300">
                🚄 -{mission.transport_discount_pct}% sur le train
              </span>
            </div>
          </section>

          {/* Description */}
          <section className="glass rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              La mission
            </h2>
            <p className="text-sm text-white/70 leading-relaxed">{mission.description}</p>

            {mission.prerequisites && (
              <div className="pt-2 border-t border-white/5">
                <p className="text-xs uppercase tracking-wider text-white/45 mb-1">Prérequis</p>
                <p className="text-sm text-white/65">{mission.prerequisites}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-white/5">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/45">Coût personnel</p>
                <p className="font-medium">
                  {Number(mission.cost_eur) === 0 ? 'Gratuit' : `${mission.cost_eur} €`}
                </p>
              </div>
              {mission.required_age_min && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/45">Âge minimum</p>
                  <p className="font-medium">{mission.required_age_min} ans</p>
                </div>
              )}
            </div>
          </section>

          {/* Application */}
          {application ? (
            <section className="glass rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                  Ta candidature
                </h2>
                <span
                  className={`text-xs uppercase tracking-wider px-2 py-1 rounded-full border ${
                    application.status === 'accepted'
                      ? 'text-emerald-300 bg-emerald-500/10 border-emerald-400/20'
                      : application.status === 'declined' || application.status === 'withdrawn'
                      ? 'text-white/40 bg-white/[0.02] border-white/10'
                      : 'text-violet-200 bg-violet-500/10 border-violet-400/20'
                  }`}
                >
                  {application.status}
                </span>
              </div>
              <p className="text-sm text-white/65 italic">"{application.motivation}"</p>
              <p className="text-xs text-white/40">
                Envoyée le {new Date(application.applied_at).toLocaleDateString('fr-FR')}
              </p>
              {application.status === 'pending' && (
                <button
                  onClick={handleWithdraw}
                  disabled={submitting}
                  className="text-sm text-white/55 hover:text-red-300 transition"
                >
                  Retirer ma candidature
                </button>
              )}
            </section>
          ) : (
            <section className="glass rounded-2xl p-5 space-y-3">
              <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                Candidater à cette mission
              </h2>
              {isFull ? (
                <p className="text-sm text-white/60">
                  Cette mission est complète. Reviens régulièrement, des places se libèrent.
                </p>
              ) : (
                <>
                  <textarea
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    rows={5}
                    maxLength={2000}
                    placeholder="Pourquoi cette mission t'inspire ? (50 caractères minimum)"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-sm focus:border-violet-400/40 focus:outline-none resize-none"
                  />
                  <div className="flex items-center justify-between text-xs text-white/40">
                    <span>{motivation.length} / 2000</span>
                    {!valid && motivation.length > 0 && (
                      <span className="text-amber-300">{50 - motivation.length} caractères restants</span>
                    )}
                  </div>
                  <button
                    onClick={handleApply}
                    disabled={!valid || submitting}
                    className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                    Envoyer ma candidature
                  </button>
                </>
              )}
            </section>
          )}

          {mission.contact_email && (
            <p className="text-xs text-white/40 text-center">
              Questions ?{' '}
              <a href={`mailto:${mission.contact_email}`} className="hover:text-white">
                {mission.contact_email}
              </a>
            </p>
          )}
        </div>
      </main>
    </>
  )
}
