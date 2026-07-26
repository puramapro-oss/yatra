'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Lock } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice, formatDate } from '@/lib/utils'
import { progressPct } from '@/lib/vacances/cagnotte'

type Cagnotte = {
  id: string
  titre: string
  destination: string | null
  objectif_eur: number
  montant_actuel_eur: number
  statut: 'active' | 'cloturee'
  lien_partage_code: string
}
type Contribution = { id: string; contributeur_nom: string; montant_eur: number; type: string; message: string | null; created_at: string }

export function CagnotteDetailView({ cagnotte, contributions, siteUrl }: { cagnotte: Cagnotte; contributions: Contribution[]; siteUrl: string }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${siteUrl}/cagnotte/${cagnotte.lien_partage_code}`

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard/vacances/cagnotte" aria-label="Retour" className="text-white/60 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft size={18} />
            <span className="text-sm">Retour</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            {cagnotte.titre}
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-6">
          <section className="glass rounded-3xl p-6 space-y-4">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400" style={{ width: `${progressPct(cagnotte.montant_actuel_eur, cagnotte.objectif_eur)}%` }} />
            </div>
            <p className="text-2xl font-bold gradient-text-aurora" style={{ fontFamily: 'var(--font-display)' }}>
              {formatPrice(cagnotte.montant_actuel_eur)} <span className="text-white/40 text-lg font-normal">/ {formatPrice(cagnotte.objectif_eur)}</span>
            </p>

            <div className="flex items-center gap-2">
              <input readOnly value={shareUrl} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/60" />
              <button type="button" onClick={copyLink} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/40 hover:bg-amber-400/25 transition flex-shrink-0">
                <Copy size={13} /> {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>
            <p className="text-[11px] text-white/40 flex items-center gap-1">
              <Lock size={10} /> Les contributions vont directement sur ton wallet YATRA.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs uppercase tracking-wider text-white/50">Contributions ({contributions.length})</h2>
            {contributions.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center">
                <p className="text-white/65 text-sm">Aucune contribution pour l&apos;instant — partage le lien !</p>
              </div>
            ) : (
              contributions.map((c) => (
                <div key={c.id} className="glass rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{c.contributeur_nom}</p>
                    {c.message && <p className="text-xs text-white/50 mt-0.5 line-clamp-1">{c.message}</p>}
                    <p className="text-[11px] text-white/35 mt-0.5">{formatDate(c.created_at)}</p>
                  </div>
                  <span className="text-emerald-300 font-semibold text-sm flex-shrink-0">+{formatPrice(c.montant_eur)}</span>
                </div>
              ))
            )}
          </section>
        </div>
      </main>
    </>
  )
}
