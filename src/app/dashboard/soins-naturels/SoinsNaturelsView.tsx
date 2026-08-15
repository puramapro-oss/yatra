'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, AlertCircle, Heart, Sparkles } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice } from '@/lib/utils'

type Soin = {
  id: string
  nom: string
  categorie: 'naturopathie' | 'cure' | 'atelier_respiration' | 'atelier_meditation' | 'autre_bien_etre'
  description: string | null
  ville: string | null
  region: string | null
  tarif_indicatif_min: number | null
  tarif_indicatif_max: number | null
  tarif_solidaire: boolean
  description_tarif_solidaire: string | null
  lien_officiel: string | null
}

const CATEGORIE_LABEL: Record<string, string> = {
  naturopathie: 'Naturopathie',
  cure: 'Cures thermales',
  atelier_respiration: 'Respiration',
  atelier_meditation: 'Méditation',
  autre_bien_etre: 'Autre bien-être',
}

const CATEGORIE_EMOJI: Record<string, string> = {
  naturopathie: '🌿',
  cure: '♨️',
  atelier_respiration: '🌬️',
  atelier_meditation: '🧘',
  autre_bien_etre: '✨',
}

export function SoinsNaturelsView({
  soins,
  userVille,
}: {
  soins: Soin[]
  userVille: string | null
}) {
  const [activeCategorie, setActiveCategorie] = useState<string | 'all'>('all')
  const [tarifSolidaireOnly, setTarifSolidaireOnly] = useState(false)

  const filtered = useMemo(() => {
    let result = soins
    if (activeCategorie !== 'all') {
      result = result.filter((s) => s.categorie === activeCategorie)
    }
    if (tarifSolidaireOnly) {
      result = result.filter((s) => s.tarif_solidaire)
    }
    return result
  }, [soins, activeCategorie, tarifSolidaireOnly])

  const categories = useMemo(() => {
    const set = new Set(soins.map((s) => s.categorie))
    return ['all', ...Array.from(set)]
  }, [soins])

  const tarifSolidaireCount = useMemo(
    () => soins.filter((s) => s.tarif_solidaire).length,
    [soins]
  )

  function formatTarif(min: number | null, max: number | null): string {
    if (!min && !max) return 'Variable'
    if (min === 0 && max === 0) return 'Gratuit'
    if (min === 0 && max) return `Gratuit - ${formatPrice(max)}`
    if (min && !max) return `À partir de ${formatPrice(min)}`
    if (min && max) {
      if (min === max) return formatPrice(min)
      return `${formatPrice(min)} - ${formatPrice(max)}`
    }
    return 'Variable'
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
            Soins naturels accessibles
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-5xl mx-auto space-y-6">
          {/* Disclaimer obligatoire bien-être non médical */}
          <section className="glass rounded-3xl p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-400/20">
            <div className="flex gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-200">Bien-être non médical uniquement</p>
                <p className="text-sm text-white/60 mt-1.5 leading-relaxed">
                  Cet annuaire recense des pratiques de bien-être accessibles (naturopathie,
                  ateliers de méditation, respiration, cures). Pour tout problème de santé,{' '}
                  <strong className="text-white/80">consulte un médecin</strong>. YATRA ne fournit
                  aucun conseil médical. En cas de détresse vitale, appelle le{' '}
                  <strong className="text-white/80">3114</strong> (numéro national de prévention du
                  suicide) ou le 15 (SAMU).
                </p>
              </div>
            </div>
          </section>

          {/* Hero KPI */}
          <section className="glass rounded-3xl p-6 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-cyan-400/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center">
                <Sparkles size={22} />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-white/45">
                  Pratiques accessibles
                </p>
                <p
                  className="text-3xl font-bold gradient-text-aurora"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {soins.length} ressources
                </p>
                <p className="text-sm text-white/55 mt-1">
                  {tarifSolidaireCount > 0 && (
                    <>
                      Dont <strong className="text-emerald-300">{tarifSolidaireCount}</strong> à
                      tarifs solidaires.
                    </>
                  )}{' '}
                  Bien-être à portée de tous.
                </p>
              </div>
            </div>
          </section>

          {/* Filtres catégories */}
          <section className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategorie(c)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm transition border ${
                  activeCategorie === c
                    ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-200'
                    : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white'
                }`}
              >
                {c === 'all'
                  ? 'Tous'
                  : `${CATEGORIE_EMOJI[c] ?? ''} ${CATEGORIE_LABEL[c] ?? c}`}
              </button>
            ))}
          </section>

          {/* Filtre tarif solidaire */}
          {tarifSolidaireCount > 0 && (
            <section className="flex items-center gap-3">
              <button
                onClick={() => setTarifSolidaireOnly(!tarifSolidaireOnly)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition border ${
                  tarifSolidaireOnly
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                    : 'border-white/10 bg-white/[0.02] text-white/60 hover:text-white'
                }`}
              >
                <Heart size={16} className={tarifSolidaireOnly ? 'fill-current' : ''} />
                Tarifs solidaires uniquement
              </button>
            </section>
          )}

          {/* Liste soins */}
          {filtered.length === 0 ? (
            <section className="glass rounded-3xl p-8 text-center border-white/5">
              <p className="text-white/50">Aucune ressource trouvée avec ces filtres.</p>
            </section>
          ) : (
            <section className="grid gap-4 md:grid-cols-2">
              {filtered.map((soin) => (
                <article
                  key={soin.id}
                  className="glass rounded-3xl p-5 border-white/5 hover:border-cyan-400/20 transition group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{CATEGORIE_EMOJI[soin.categorie]}</span>
                        <h3 className="text-base font-semibold text-white/90 leading-snug">
                          {soin.nom}
                        </h3>
                      </div>
                      <p className="text-xs text-white/45 uppercase tracking-wider">
                        {CATEGORIE_LABEL[soin.categorie]}
                      </p>
                    </div>
                    {soin.tarif_solidaire && (
                      <div className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-xs text-emerald-300 font-medium">
                        <Heart size={12} className="inline mr-1 fill-current" />
                        Solidaire
                      </div>
                    )}
                  </div>

                  {soin.description && (
                    <p className="text-sm text-white/60 leading-relaxed mb-3">
                      {soin.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    {(soin.ville || soin.region) && (
                      <p className="text-white/50">
                        📍{' '}
                        {soin.ville && soin.region
                          ? `${soin.ville}, ${soin.region}`
                          : soin.ville || soin.region}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-white/70 font-medium">
                        {formatTarif(soin.tarif_indicatif_min, soin.tarif_indicatif_max)}
                      </p>
                      {soin.lien_officiel && (
                        <a
                          href={soin.lien_officiel}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 hover:bg-cyan-500/20 transition text-xs font-medium"
                        >
                          En savoir plus
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>

                    {soin.tarif_solidaire && soin.description_tarif_solidaire && (
                      <p className="text-xs text-emerald-300/80 leading-relaxed pt-2 border-t border-white/5">
                        💚 {soin.description_tarif_solidaire}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </section>
          )}

          {/* Note bas de page */}
          <section className="text-center text-xs text-white/40 leading-relaxed">
            <p>
              Ces ressources sont documentées à titre informatif. YATRA ne garantit pas
              l&apos;exactitude des tarifs ni la disponibilité des services. Contactez directement
              les organismes pour confirmation.
            </p>
          </section>
        </div>
      </main>
    </>
  )
}
