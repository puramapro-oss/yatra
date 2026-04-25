'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Copy, Loader2, Megaphone, Send, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice, formatRelativeDate } from '@/lib/utils'
import {
  TIER_CONFIG,
  nextTier,
  normalizeSlug,
  isValidSlug,
  isReservedSlug,
  type AmbassadorTier,
} from '@/lib/ambassadeur'

type Profile = {
  id: string
  slug: string
  bio: string | null
  social_links: Record<string, string>
  status: string
  tier: string
  total_clicks: number
  total_signups: number
  total_conversions: number
  total_earnings_eur: number
  free_plan_granted: boolean
  kit_downloaded: boolean
  approved_at: string
  created_at: string
}

type Conv = {
  id: string
  event_type: string
  amount_eur: number
  commission_eur: number
  paid_at: string | null
  created_at: string
}

export function AmbassadeurView({
  ambassadeur,
  lastConversions,
  userFullName,
}: {
  ambassadeur: Profile | null
  lastConversions: Conv[]
  userFullName: string | null
}) {
  const router = useRouter()
  const [slug, setSlug] = useState(userFullName ? normalizeSlug(userFullName) : '')
  const [bio, setBio] = useState('')
  const [instagram, setInstagram] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function applyAmbassadeur() {
    if (!isValidSlug(slug)) {
      toast.error('Slug : 3-30 chars · a-z 0-9 -')
      return
    }
    if (isReservedSlug(slug)) {
      toast.error('Slug réservé')
      return
    }
    setSubmitting(true)
    try {
      const r = await fetch('/api/ambassadeur/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          bio: bio.trim() || undefined,
          social_links: {
            instagram: instagram.trim() || undefined,
            tiktok: tiktok.trim() || undefined,
          },
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Erreur')
      toast.success('Bienvenue ambassadeur 🎉')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
      setSubmitting(false)
    }
  }

  if (!ambassadeur) {
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
              Devenir ambassadeur
            </h1>
          </header>

          <div className="px-6 pb-16 max-w-3xl mx-auto space-y-6">
            <section className="glass rounded-3xl p-6 bg-gradient-to-br from-emerald-500/10 to-violet-500/10 space-y-3">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
                  <Megaphone size={22} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold gradient-text-aurora" style={{ fontFamily: 'var(--font-display)' }}>
                    Programme ouvert à tous
                  </h2>
                  <p className="text-sm text-white/65 mt-1">
                    Lien personnel /go/[slug]. Commission 10% à 25% selon ton tier. Plan offert dès Bronze.
                    Pas de validation manuelle, pas d&apos;attente.
                  </p>
                </div>
              </div>
            </section>

            <section className="glass rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Choisis ton slug</h3>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(normalizeSlug(e.target.value))}
                placeholder="ton-pseudo"
                maxLength={30}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-sm focus:border-emerald-400/40 focus:outline-none font-mono"
              />
              <p className="text-xs text-white/45">
                3-30 chars · a-z, 0-9, tirets · sera ton lien <span className="font-mono">yatra.purama.dev/go/{slug || 'ton-slug'}</span>
              </p>

              <h3 className="font-semibold pt-2" style={{ fontFamily: 'var(--font-display)' }}>Présente-toi</h3>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Ce que tu fais, ce qui te tient à cœur, pourquoi YATRA…"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-sm focus:border-emerald-400/40 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@instagram"
                  className="bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-sm focus:border-emerald-400/40 focus:outline-none"
                />
                <input
                  type="text"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="@tiktok"
                  className="bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-sm focus:border-emerald-400/40 focus:outline-none"
                />
              </div>
              <button
                onClick={applyAmbassadeur}
                disabled={submitting || !isValidSlug(slug) || isReservedSlug(slug)}
                className="btn-primary w-full justify-center disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Activer mon programme
              </button>
            </section>

            <section className="glass rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>8 paliers · 10% → 25%</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {Object.values(TIER_CONFIG).map((t) => (
                  <div key={t.tier} className="rounded-xl bg-white/[0.04] border border-white/5 p-2.5 text-center">
                    <div className="text-2xl">{t.emoji}</div>
                    <p className="font-semibold">{t.label}</p>
                    <p className="text-white/55 text-[11px]">{formatPrice(t.threshold_eur)} → {t.commission_pct}%</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </>
    )
  }

  const tier = ambassadeur.tier as AmbassadorTier
  const tierCfg = TIER_CONFIG[tier]
  const next = nextTier(tier)
  const remaining = next.threshold_eur != null ? Math.max(0, next.threshold_eur - ambassadeur.total_earnings_eur) : 0
  const link = `https://yatra.purama.dev/go/${ambassadeur.slug}`

  function copyLink() {
    navigator.clipboard?.writeText(link).then(
      () => toast.success('Lien copié ✨'),
      () => toast.error('Impossible de copier'),
    )
  }

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
            Mon programme ambassadeur
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-6">
          {/* Hero tier */}
          <section className="glass rounded-3xl p-6 bg-gradient-to-br from-emerald-500/10 to-violet-500/10 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{tierCfg.emoji}</span>
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/45">Tier</p>
                  <h2 className="text-2xl font-bold gradient-text-aurora" style={{ fontFamily: 'var(--font-display)' }}>
                    {tierCfg.label} · {tierCfg.commission_pct}%
                  </h2>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-white/45">Total gagné</p>
                <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  {formatPrice(ambassadeur.total_earnings_eur)}
                </p>
              </div>
            </div>
            {next.next && next.threshold_eur && (
              <div>
                <p className="text-xs text-white/65">
                  Prochain palier : <span className="font-semibold">{TIER_CONFIG[next.next].label}</span> ({TIER_CONFIG[next.next].commission_pct}%) à {formatPrice(next.threshold_eur)}
                </p>
                <div className="rounded-full bg-white/5 h-2 overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-violet-400 transition-all"
                    style={{ width: `${Math.min(100, (ambassadeur.total_earnings_eur / next.threshold_eur) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-white/45 mt-1">{formatPrice(remaining)} restants</p>
              </div>
            )}
          </section>

          {/* Lien personnel */}
          <section className="glass rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Ton lien</h3>
            <div className="flex items-center gap-3">
              <input
                readOnly
                value={link}
                className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl p-3 text-sm font-mono focus:outline-none"
              />
              <button
                onClick={copyLink}
                className="w-12 h-12 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 flex items-center justify-center transition"
                aria-label="Copier le lien"
              >
                <Copy size={18} />
              </button>
            </div>
            <p className="text-xs text-white/45">Cookie 30j. Toute conversion remontée à toi.</p>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-3 gap-3">
            <Stat label="Clics" value={ambassadeur.total_clicks.toLocaleString('fr-FR')} />
            <Stat label="Signups" value={ambassadeur.total_signups.toLocaleString('fr-FR')} />
            <Stat label="Conversions" value={ambassadeur.total_conversions.toLocaleString('fr-FR')} />
          </section>

          {/* Avantages tier */}
          <section className="glass rounded-2xl p-5 space-y-2">
            <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Tes avantages {tierCfg.label}</h3>
            <ul className="text-sm text-white/65 space-y-1">
              {tierCfg.perks.map((p, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-300 mt-0.5">✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Conversions */}
          {lastConversions.length > 0 && (
            <section className="glass rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Dernières conversions</h3>
              <ul className="divide-y divide-white/5">
                {lastConversions.slice(0, 10).map((c) => (
                  <li key={c.id} className="py-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {c.event_type === 'signup' ? '🌱 Inscription' : c.event_type === 'first_payment' ? '💎 1er paiement' : '🔁 Récurrence'}
                      </p>
                      <p className="text-xs text-white/45">{formatRelativeDate(c.created_at)}{c.paid_at && ' · payé'}</p>
                    </div>
                    <span className="font-semibold text-emerald-300">+{formatPrice(c.commission_eur)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Outils */}
          <section className="glass rounded-2xl p-5 space-y-2">
            <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Outils</h3>
            <a
              href={`https://yatra.purama.dev/api/og?title=Rejoins-moi%20sur%20YATRA&subtitle=${encodeURIComponent(ambassadeur.slug)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-emerald-300 hover:text-emerald-200 inline-flex items-center gap-1"
            >
              Image OG personnalisée <ExternalLink size={12} />
            </a>
          </section>
        </div>
      </main>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-4 text-center">
      <p className="text-xs uppercase tracking-wider text-white/45">{label}</p>
      <p className="text-2xl font-bold mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
    </div>
  )
}
