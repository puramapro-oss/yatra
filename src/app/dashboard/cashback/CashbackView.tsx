'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice } from '@/lib/utils'

type Partner = {
  id: string
  slug: string
  name: string
  category: string
  description: string
  logo_url: string | null
  commission_pct: number
  user_share_pct: number
  ethical_score: number
  popularity_score: number
  max_cashback_eur: number | null
  min_purchase_eur: number | null
  conditions: string | null
}

type Tx = {
  id: string
  partner_id: string
  purchase_amount_eur: number
  user_share_eur: number
  status: string
  created_at: string
}

const CATEGORY_LABEL: Record<string, string> = {
  bio: 'Bio & alimentation',
  vrac: 'Vrac & zéro déchet',
  mobilite: 'Mobilité douce',
  energie: 'Énergie verte',
  mode_ethique: 'Mode éthique',
  cosmetique: 'Cosmétique naturelle',
  librairie: 'Librairie indé',
  voyage: 'Voyage responsable',
}

const CATEGORY_EMOJI: Record<string, string> = {
  bio: '🥬',
  vrac: '🌾',
  mobilite: '🚲',
  energie: '⚡',
  mode_ethique: '👕',
  cosmetique: '🌿',
  librairie: '📚',
  voyage: '✈️',
}

export function CashbackView({
  partners,
  txs,
  totalEarned,
}: {
  partners: Partner[]
  txs: Tx[]
  totalEarned: number
}) {
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all')
  const [redirectingId, setRedirectingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return partners
    return partners.filter((p) => p.category === activeCategory)
  }, [partners, activeCategory])

  const categories = useMemo(() => {
    const set = new Set(partners.map((p) => p.category))
    return ['all', ...Array.from(set)]
  }, [partners])

  async function handleClick(partner: Partner) {
    setRedirectingId(partner.id)
    try {
      const r = await fetch(`/api/cashback/click/${partner.id}`, { method: 'POST' })
      const data = await r.json()
      if (!r.ok || !data.redirect_url) throw new Error(data?.error ?? 'Erreur')
      toast.success(`Redirection vers ${partner.name}…`)
      window.open(data.redirect_url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setRedirectingId(null)
    }
  }

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
            Cashback éthique
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-5xl mx-auto space-y-6">
          {/* Hero KPI */}
          <section className="glass rounded-3xl p-6 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-400/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
                <Sparkles size={22} />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-white/45">Cashback gagné</p>
                <p
                  className="text-3xl font-bold gradient-text-aurora"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {formatPrice(totalEarned)}
                </p>
                <p className="text-sm text-white/55 mt-1">
                  Crédité automatiquement sur ton wallet à chaque achat validé.
                </p>
              </div>
            </div>
          </section>

          {/* Catégories */}
          <section className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm transition border ${
                  activeCategory === c
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                    : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white'
                }`}
              >
                {c === 'all' ? 'Tous' : `${CATEGORY_EMOJI[c] ?? ''} ${CATEGORY_LABEL[c] ?? c}`}
              </button>
            ))}
          </section>

          {/* Cards partenaires */}
          {filtered.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-white/55">
              Aucun partenaire dans cette catégorie pour le moment.
            </div>
          ) : (
            <section className="grid sm:grid-cols-2 gap-4">
              {filtered.map((p) => {
                const userPct = (Number(p.commission_pct) * Number(p.user_share_pct)) / 100
                return (
                  <article key={p.id} className="glass rounded-2xl p-5 flex flex-col gap-4">
                    <header className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center text-2xl">
                        {CATEGORY_EMOJI[p.category] ?? '🌿'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-semibold tracking-tight truncate"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {p.name}
                        </h3>
                        <p className="text-xs text-white/45 mt-0.5">
                          {CATEGORY_LABEL[p.category] ?? p.category}
                          {' · '}
                          <span className="text-emerald-300">
                            {userPct.toFixed(1)}% pour toi
                          </span>
                        </p>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-emerald-300 bg-emerald-500/10 border border-emerald-400/20 px-2 py-1 rounded-full">
                        Éthique {p.ethical_score}/100
                      </span>
                    </header>

                    <p className="text-sm text-white/65 leading-snug line-clamp-3">{p.description}</p>

                    {p.conditions && (
                      <p className="text-xs text-white/40">
                        <span className="text-white/55">Conditions :</span> {p.conditions}
                      </p>
                    )}

                    <button
                      onClick={() => handleClick(p)}
                      disabled={redirectingId === p.id}
                      className="btn-primary w-full justify-center mt-auto disabled:opacity-50 disabled:cursor-wait"
                    >
                      {redirectingId === p.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ExternalLink size={16} />
                      )}
                      Acheter chez {p.name}
                    </button>
                  </article>
                )
              })}
            </section>
          )}

          {/* Mes transactions */}
          {txs.length > 0 && (
            <section className="glass rounded-2xl p-5 space-y-3">
              <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                Mes derniers achats validés
              </h2>
              <ul className="divide-y divide-white/5">
                {txs.map((t) => {
                  const partner = partners.find((p) => p.id === t.partner_id)
                  return (
                    <li key={t.id} className="py-2 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{partner?.name ?? '—'}</p>
                        <p className="text-xs text-white/40">
                          {new Date(t.created_at).toLocaleDateString('fr-FR')} ·{' '}
                          {formatPrice(Number(t.purchase_amount_eur))} d'achat
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            t.status === 'confirmed' || t.status === 'paid'
                              ? 'text-emerald-300'
                              : t.status === 'cancelled'
                              ? 'text-white/30 line-through'
                              : 'text-white/55'
                          }`}
                        >
                          +{formatPrice(Number(t.user_share_eur))}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-white/35">
                          {t.status}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <p className="text-xs text-white/35 text-center">
            Chaque cashback validé est crédité sur ton wallet sub-PURAMA. Tu peux le retirer dès 5€.
          </p>
        </div>
      </main>
    </>
  )
}
