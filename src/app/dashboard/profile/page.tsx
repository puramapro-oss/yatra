import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { computeScoreHumanite, rangFromScore, RANG_LABELS, RANG_EMOJI } from '@/lib/score-humanite'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { ADNMobiliteRadar } from '@/components/profile/ADNMobiliteRadar'
import { FilDeVieTimeline } from '@/components/profile/FilDeVieTimeline'
import { ANCIENNETE_CAP_MONTHS, AMBIANCE_LABELS, PURAMA_ECOSYSTEM } from '@/lib/constants'
import { ancienneteMultiplier } from '@/lib/utils'
import { RANG_AVANTAGES, nextRang, rangMultiplier } from '@/lib/rangs'
import { trustLevel } from '@/lib/trust'
import type { AmbianceMode } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/profile')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, ville_principale, pays_principal, ambiance_preferee, score_humanite, rang, anciennete_months, streak_days, awakening_level, level, xp')
    .eq('id', user.id)
    .maybeSingle()

  const { data: adn } = await supabase
    .from('adn_mobilite')
    .select('style, modes_preferes, rythme_appris, prefs_sensorielles')
    .eq('user_id', user.id)
    .maybeSingle()

  const { count: parrainagesActifs } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', user.id)
    .eq('status', 'active')

  const { data: trustRow } = await supabase
    .from('trust_scores')
    .select('score, proofs_ok, proofs_failed')
    .eq('user_id', user.id)
    .maybeSingle()

  // Recompute breakdown live (placeholder pour P3+ : trajets/missions encore 0)
  const score = computeScoreHumanite({
    trajets_propres_30j: 0,
    missions_done_30j: 0,
    parrainages_actifs: parrainagesActifs ?? 0,
    partages_30j: 0,
    streak_days: profile?.streak_days ?? 0,
    anciennete_months: profile?.anciennete_months ?? 0,
  })

  const rang = rangFromScore(score.total)
  const multiplier = ancienneteMultiplier(profile?.anciennete_months ?? 0)
  const ambiance = (profile?.ambiance_preferee ?? 'foret') as AmbianceMode
  const firstName = profile?.full_name?.split(' ')[0] ?? null

  const trustScore = trustRow?.score ?? 50
  const trust = trustLevel(trustScore)
  const avantages = RANG_AVANTAGES[rang]
  const next = nextRang(rang)
  const totalMultiplier = Math.round(multiplier * rangMultiplier(rang) * 100) / 100

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-white/55 hover:text-white inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Tableau de bord
          </Link>
          <span className="text-xs text-white/40 uppercase tracking-wider">Mon profil</span>
        </header>

        <div className="px-6 pb-12 max-w-4xl mx-auto space-y-6">
          {/* Hero identité */}
          <section className="glass rounded-3xl p-6 sm:p-8 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{RANG_EMOJI[rang]}</span>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">Rang YATRA</p>
                <h1
                  className="text-3xl font-bold tracking-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {firstName ? `${firstName}, ` : ''}
                  <span className="gradient-text-aurora">{RANG_LABELS[rang]}</span>
                </h1>
              </div>
            </div>
            <p className="text-sm text-white/55">
              {profile?.ville_principale ?? '—'} · Ambiance {AMBIANCE_LABELS[ambiance]}
            </p>
          </section>

          {/* Score d'Humanité + ADN radar */}
          <section className="grid md:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-6 space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">Score d&apos;Humanité</p>
              <p className="text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="gradient-text-aurora">{score.total.toFixed(2)}</span>
                <span className="text-lg text-white/40 ml-1">/ 10</span>
              </p>
              <div className="space-y-1.5 pt-2 text-xs text-white/65">
                <Stat label="Trajets propres" value={score.breakdown.trajets_propres} max={3} />
                <Stat label="Missions" value={score.breakdown.missions} max={2} />
                <Stat label="Entraide" value={score.breakdown.entraide} max={2} />
                <Stat label="Régularité" value={score.breakdown.regularite} max={1.5} />
                <Stat label="Ancienneté" value={score.breakdown.anciennete} max={1.5} />
              </div>
            </div>

            <div className="glass rounded-2xl p-6 space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">ADN Mobilité</p>
              <ADNMobiliteRadar breakdown={score.breakdown} />
            </div>
          </section>

          {/* Trust Score + Rang avantages */}
          <section className="grid md:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-white/45 flex items-center gap-1.5">
                  <Shield size={12} /> Trust Score
                </p>
                <span className="text-xs text-white/45">{trust.label}</span>
              </div>
              <p className="text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="gradient-text-aurora">{trustScore}</span>
                <span className="text-lg text-white/40 ml-1">/ 100</span>
              </p>
              <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-violet-400 transition-all"
                  style={{ width: `${trustScore}%` }}
                />
              </div>
              <p className="text-xs text-white/40">
                {trustRow?.proofs_ok ?? 0} preuves OK · {trustRow?.proofs_failed ?? 0} rejets. Stake dès 30 · retrait dès 40.
              </p>
            </div>

            <div className="glass rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">Avantages rang {RANG_LABELS[rang]}</p>
                <span className="text-xs gradient-text-aurora font-semibold">{avantages.multiplier_label}</span>
              </div>
              <ul className="text-xs text-white/65 space-y-1">
                {avantages.features.slice(0, 4).map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-300">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {next.next && next.thresholdScore && (
                <p className="text-xs text-white/45 pt-1 border-t border-white/5">
                  Prochain rang : <span className="text-white/75">{RANG_LABELS[next.next]}</span> à {next.thresholdScore}/10 ({(next.thresholdScore - score.total).toFixed(2)} restants)
                </p>
              )}
            </div>
          </section>

          {/* Ancienneté + multiplicateur (combiné rang) */}
          <section className="glass rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">Multiplicateur total · ancienneté × rang</p>
              <span className="text-xs text-white/45">
                cap {ANCIENNETE_CAP_MONTHS} mois
              </span>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <p className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                ×{totalMultiplier.toFixed(2)}
              </p>
              <p className="text-sm text-white/55">
                ×{multiplier.toFixed(2)} ancienneté ({profile?.anciennete_months ?? 0} mois) · ×{rangMultiplier(rang).toFixed(1)} rang
              </p>
            </div>
            <div className="h-2 rounded-full bg-white/8 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                style={{
                  width: `${Math.min(100, ((profile?.anciennete_months ?? 0) / ANCIENNETE_CAP_MONTHS) * 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-white/40">
              S&apos;applique sur tes gains Vida Credits. Plus tu restes + plus tu montes en rang = plus tes trajets propres rapportent.
            </p>
          </section>

          {/* ADN Mobilité — détail */}
          {adn && (
            <section className="glass rounded-2xl p-6 space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">Tes habitudes apprises</p>
              <div className="grid sm:grid-cols-2 gap-3 text-sm text-white/75">
                <div>
                  <span className="text-white/40 text-xs uppercase tracking-wider block mb-0.5">Style</span>
                  {adn.style ?? '—'}
                </div>
                <div>
                  <span className="text-white/40 text-xs uppercase tracking-wider block mb-0.5">Modes préférés</span>
                  {(adn.modes_preferes ?? []).join(' · ') || '—'}
                </div>
              </div>
            </section>
          )}

          {/* Fil de Vie */}
          <section className="glass rounded-2xl p-6 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/45 mb-1">Fil de Vie</p>
              <p className="text-xs text-white/45">
                Timeline irréversible de tes actions positives. Partagée avec tout l&apos;écosystème PURAMA.
              </p>
            </div>
            <FilDeVieTimeline />
          </section>

          {/* Univers Personnel — apps écosystème */}
          <section className="glass rounded-2xl p-6 space-y-3">
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Ton Univers Personnel</p>
            <p className="text-xs text-white/45">
              Ton compte YATRA est partagé avec tout l&apos;écosystème PURAMA. Ton Score, ton ancienneté, ton Fil de Vie circulent.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {PURAMA_ECOSYSTEM.map((app) => (
                <a
                  key={app.slug}
                  href={`https://${app.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition"
                >
                  <p className="font-semibold text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                    {app.name}
                  </p>
                  <p className="text-[10px] text-white/45 leading-tight mt-0.5">{app.tagline}</p>
                </a>
              ))}
            </div>
          </section>

          {/* XP / niveau */}
          <section className="glass rounded-2xl p-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40">XP</p>
              <p className="text-2xl font-bold mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                {profile?.xp ?? 0}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40">Niveau</p>
              <p className="text-2xl font-bold mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                {profile?.level ?? 1}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40">Streak</p>
              <p className="text-2xl font-bold mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                {profile?.streak_days ?? 0} 🔥
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

function Stat({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 text-white/55">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <span className="w-14 text-right text-white/75 tabular-nums">
        {value.toFixed(2)} / {max}
      </span>
    </div>
  )
}
