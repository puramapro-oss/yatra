'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Layers, ExternalLink, CheckCircle2 } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice } from '@/lib/utils'

type StackingStep = { id: string; titre: string; conseil: string; lien?: string }

const TYPES = [
  { id: 'vol' as const, label: 'Vol' },
  { id: 'hotel' as const, label: 'Hôtel' },
  { id: 'activite' as const, label: 'Activité' },
  { id: 'location_voiture' as const, label: 'Location voiture' },
]

export function StackingView() {
  const [merchant, setMerchant] = useState('')
  const [typeReservation, setTypeReservation] = useState<typeof TYPES[number]['id']>('vol')
  const [checklist, setChecklist] = useState<StackingStep[] | null>(null)
  const [loading, setLoading] = useState(false)

  const [montant, setMontant] = useState('')
  const [cashback, setCashback] = useState('')
  const [codePromo, setCodePromo] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!merchant) return
    setLoading(true)
    try {
      const r = await fetch(`/api/vacances/stacking?merchant=${encodeURIComponent(merchant)}&type_reservation=${typeReservation}`)
      const data = await r.json()
      if (r.ok) setChecklist(data.checklist)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    const r = await fetch('/api/vacances/stacking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant,
        type_reservation: typeReservation,
        montant_reservation_eur: Number(montant) || 0,
        cashback_recupere_eur: Number(cashback) || 0,
        code_promo_recupere_eur: Number(codePromo) || 0,
      }),
    })
    if (r.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  const totalRecupere = (Number(cashback) || 0) + (Number(codePromo) || 0)
  const pctRecupere = montant && Number(montant) > 0 ? Math.round((totalRecupere / Number(montant)) * 100) : 0

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard/vacances" aria-label="Retour" className="text-white/60 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft size={18} />
            <span className="text-sm">Retour</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Stacking automatique
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-6">
          <section className="glass rounded-3xl p-6 space-y-2">
            <div className="flex items-center gap-2 text-violet-300">
              <Layers size={18} />
              <span className="text-xs uppercase tracking-wider">La pile complète avant de payer</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Cashback, code promo, fidélité, moyen de paiement — dans cet ordre, avant de valider ta réservation.
              Objectif réaliste : 15-30% récupérés selon le site.
            </p>
          </section>

          <form onSubmit={handleGenerate} className="glass rounded-3xl p-6 space-y-3">
            <input
              type="text"
              placeholder="Nom du site de réservation (ex : Booking.com)"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400/40"
            />
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeReservation(t.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                    typeReservation === t.id ? 'bg-violet-400/15 text-violet-300 border-violet-400/40' : 'bg-white/5 text-white/60 border-white/10'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button type="submit" disabled={loading || !merchant} className="w-full bg-gradient-to-r from-violet-400 to-cyan-400 text-black font-semibold rounded-xl py-3 text-sm disabled:opacity-50">
              {loading ? 'Génération…' : 'Générer ma pile'}
            </button>
          </form>

          {checklist && (
            <section className="glass rounded-3xl p-6 space-y-4">
              <ol className="space-y-3">
                {checklist.map((step) => (
                  <li key={step.id} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                    <h3 className="text-sm font-semibold">{step.titre}</h3>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">{step.conseil}</p>
                    {step.lien && (
                      <a href={step.lien} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-violet-300 mt-1.5 hover:text-violet-200 transition">
                        Chercher <ExternalLink size={11} />
                      </a>
                    )}
                  </li>
                ))}
              </ol>

              <div className="border-t border-white/5 pt-4 space-y-3">
                <p className="text-xs text-white/50 uppercase tracking-wider">Ce que tu as récupéré</p>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" min={0} placeholder="Montant total (€)" value={montant} onChange={(e) => setMontant(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs" />
                  <input type="number" min={0} placeholder="Cashback (€)" value={cashback} onChange={(e) => setCashback(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs" />
                  <input type="number" min={0} placeholder="Code promo (€)" value={codePromo} onChange={(e) => setCodePromo(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs" />
                </div>
                {totalRecupere > 0 && (
                  <p className="text-sm text-emerald-300 font-semibold">
                    Total récupéré : {formatPrice(totalRecupere)} {pctRecupere > 0 && `(${pctRecupere}%)`}
                  </p>
                )}
                <button type="button" onClick={handleSave} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-400/25 transition">
                  <CheckCircle2 size={13} /> {saved ? 'Enregistré !' : 'Enregistrer'}
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  )
}
