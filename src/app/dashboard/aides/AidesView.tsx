'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Filter, Sparkles, MapPin, Banknote, ExternalLink, Bookmark, BookmarkCheck } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice } from '@/lib/utils'

type Aide = {
  id: string
  slug: string | null
  nom: string
  category: string | null
  region: string | null
  montant_max: number | null
  url_officielle: string | null
  source_url: string | null
  source_type: string | null
  description: string | null
  _score: number
  _reasons: string[]
  _followed: boolean
}

const CATEGORIES = [
  { id: '', label: 'Toutes', emoji: '✨' },
  { id: 'transport', label: 'Transport', emoji: '🚲' },
  { id: 'social', label: 'Social', emoji: '🤝' },
  { id: 'logement', label: 'Logement', emoji: '🏠' },
  { id: 'energie', label: 'Énergie', emoji: '⚡' },
  { id: 'mobilite_handicap', label: 'Handicap', emoji: '♿' },
  { id: 'sante', label: 'Santé', emoji: '🏥' },
]

export function AidesView({
  aides,
  profileUsed,
  villePrincipale,
}: {
  aides: Aide[]
  profileUsed: { region?: string; situations?: string[]; age?: number | null; transport_modes?: string[] }
  villePrincipale: string | null
}) {
  const [activeCat, setActiveCat] = useState<string>('')

  const filtered = useMemo(() => {
    if (!activeCat) return aides
    return aides.filter((a) => a.category === activeCat)
  }, [aides, activeCat])

  const totalPotentiel = filtered.reduce((s, a) => s + Number(a.montant_max ?? 0), 0)
  const followedCount = filtered.filter((a) => a._followed).length

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-5xl mx-auto flex items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="Retour"
            className="text-white/60 hover:text-white transition flex items-center gap-1.5"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Retour</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Mes droits & aides
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-5xl mx-auto space-y-6">
          {/* Hero KPI */}
          <section className="glass rounded-3xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-emerald-300">
              <Sparkles size={18} />
              <span className="text-xs uppercase tracking-wider">Potentiel détecté pour ton profil</span>
            </div>
            <p className="text-4xl sm:text-5xl font-bold gradient-text-aurora" style={{ fontFamily: 'var(--font-display)' }}>
              {filtered.length} aide{filtered.length > 1 ? 's' : ''}
              {totalPotentiel > 0 && (
                <>
                  <span className="text-white/30 mx-2">·</span>
                  <span>jusqu&apos;à {formatPrice(totalPotentiel)}</span>
                </>
              )}
            </p>
            <p className="text-sm text-white/55 leading-relaxed">
              Détectées en croisant ta situation, ta région ({profileUsed.region ?? '—'})
              {villePrincipale && <> autour de <strong className="text-white/85">{villePrincipale}</strong></>} et tes modes de transport préférés.
            </p>
            {followedCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 mt-2">
                <BookmarkCheck size={12} /> {followedCount} aide{followedCount > 1 ? 's' : ''} suivie{followedCount > 1 ? 's' : ''}
              </div>
            )}
          </section>

          {/* Filtres catégorie */}
          <section className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            <Filter size={14} className="text-white/40 flex-shrink-0" />
            {CATEGORIES.map((c) => {
              const count = c.id === '' ? aides.length : aides.filter((a) => a.category === c.id).length
              const active = activeCat === c.id
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
                    active
                      ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/40'
                      : 'bg-white/5 text-white/65 border border-white/10 hover:bg-white/8'
                  }`}
                >
                  <span>{c.emoji}</span>
                  <span>{c.label}</span>
                  {count > 0 && <span className="text-[10px] text-white/40">{count}</span>}
                </button>
              )
            })}
          </section>

          {/* Liste */}
          {filtered.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center space-y-2">
              <p className="text-4xl">🔍</p>
              <p className="text-white/65 text-sm">Aucune aide détectée pour cette catégorie.</p>
              <p className="text-white/40 text-xs">Le radar Tavily continue de chercher en arrière-plan.</p>
            </div>
          ) : (
            <section className="grid sm:grid-cols-2 gap-3">
              {filtered.map((a) => (
                <AideCard key={a.id} aide={a} />
              ))}
            </section>
          )}

          <p className="text-[11px] text-white/35 text-center pt-2">
            Aides vérifiées sur sources officielles (service-public.fr, gouv.fr, ameli.fr).
            Le radar tourne quotidiennement pour intégrer toute nouvelle aide publiée.
          </p>
        </div>
      </main>
    </>
  )
}

function AideCard({ aide }: { aide: Aide }) {
  const detailHref = `/dashboard/aides/${aide.slug ?? aide.id}`
  const isOfficial = aide.source_type === 'official'
  const top3reasons = aide._reasons.slice(0, 3)

  return (
    <Link
      href={detailHref}
      className="glass rounded-2xl p-4 space-y-3 hover:border-emerald-400/30 transition group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <CategoryBadge category={aide.category} />
            {aide.region && aide.region !== 'FR' && <RegionBadge region={aide.region} />}
            {!isOfficial && <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30">Veille</span>}
          </div>
          <h3 className="font-semibold text-sm leading-tight mt-1.5 line-clamp-2 group-hover:text-emerald-300 transition">
            {aide.nom}
          </h3>
        </div>
        {aide._followed ? (
          <BookmarkCheck size={16} className="text-emerald-400 flex-shrink-0" />
        ) : (
          <Bookmark size={16} className="text-white/30 group-hover:text-white/55 transition flex-shrink-0" />
        )}
      </div>

      {aide.description && (
        <p className="text-xs text-white/55 line-clamp-2 leading-relaxed">{aide.description}</p>
      )}

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3 text-xs">
          {aide.montant_max && Number(aide.montant_max) > 0 ? (
            <span className="flex items-center gap-1 text-emerald-300 font-semibold">
              <Banknote size={12} /> jusqu&apos;à {formatPrice(Number(aide.montant_max))}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-white/45">
              <Banknote size={12} /> Selon situation
            </span>
          )}
        </div>
        <ScoreBadge score={aide._score} />
      </div>

      {top3reasons.length > 0 && (
        <ul className="border-t border-white/5 pt-2 space-y-0.5">
          {top3reasons.map((r, i) => (
            <li key={i} className="text-[11px] text-white/50 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-400/60" /> {r}
            </li>
          ))}
        </ul>
      )}
    </Link>
  )
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null
  const map: Record<string, { label: string; color: string }> = {
    transport: { label: '🚲 Transport', color: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30' },
    social: { label: '🤝 Social', color: 'bg-violet-400/10 text-violet-300 border-violet-400/30' },
    logement: { label: '🏠 Logement', color: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/30' },
    energie: { label: '⚡ Énergie', color: 'bg-amber-400/10 text-amber-300 border-amber-400/30' },
    mobilite_handicap: { label: '♿ Handicap', color: 'bg-rose-400/10 text-rose-300 border-rose-400/30' },
    sante: { label: '🏥 Santé', color: 'bg-pink-400/10 text-pink-300 border-pink-400/30' },
  }
  const c = map[category] ?? { label: category, color: 'bg-white/5 text-white/55 border-white/10' }
  return (
    <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${c.color}`}>
      {c.label}
    </span>
  )
}

function RegionBadge({ region }: { region: string }) {
  return (
    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border bg-white/5 text-white/55 border-white/10 inline-flex items-center gap-1">
      <MapPin size={9} /> {region}
    </span>
  )
}

function ScoreBadge({ score }: { score: number }) {
  let cls = 'bg-white/5 text-white/55'
  let label = 'Possible'
  if (score >= 75) {
    cls = 'bg-emerald-400/15 text-emerald-300 border-emerald-400/40'
    label = 'Très probable'
  } else if (score >= 50) {
    cls = 'bg-cyan-400/15 text-cyan-300 border-cyan-400/40'
    label = 'Probable'
  } else if (score >= 30) {
    cls = 'bg-violet-400/15 text-violet-300 border-violet-400/40'
    label = 'À étudier'
  }
  return (
    <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${cls}`}>
      {label} {score}
    </span>
  )
}

// Utility for inline ext link icon (used elsewhere if needed)
export { ExternalLink }
