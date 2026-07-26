'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, UtensilsCrossed, Bus, Calculator, Camera, ExternalLink, Plus, X } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice } from '@/lib/utils'

type Ville = { ville: string; pays: string; depuis: string; description: string }
type RepasAntiGaspi = { nom: string; url: string; description: string; commentCaMarche: string[] }
type Activite = { nom: string; prixEur: string }

export function SurPlaceView({ villesTransportGratuit, repasAntiGaspi }: { villesTransportGratuit: Ville[]; repasAntiGaspi: RepasAntiGaspi | null }) {
  const [ville, setVille] = useState('')
  const [prixPass, setPrixPass] = useState('')
  const [activites, setActivites] = useState<Activite[]>([{ nom: '', prixEur: '' }])
  const [result, setResult] = useState<{ totalIndividuelEur: number; economieEur: number; rentable: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  function updateActivite(i: number, field: keyof Activite, value: string) {
    setActivites((prev) => prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)))
  }

  async function handleCalculer(e: React.FormEvent) {
    e.preventDefault()
    const validActivites = activites.filter((a) => a.nom && a.prixEur).map((a) => ({ nom: a.nom, prix_eur: Number(a.prixEur) }))
    if (!prixPass || validActivites.length === 0) return
    setLoading(true)
    try {
      const r = await fetch('/api/vacances/sur-place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ville: ville || null, prix_pass_eur: Number(prixPass), activites: validActivites }),
      })
      const data = await r.json()
      if (r.ok) setResult(data)
    } finally {
      setLoading(false)
    }
  }

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
            Sur place
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-6">
          {repasAntiGaspi && (
            <section className="glass rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-emerald-300">
                <UtensilsCrossed size={18} />
                <span className="text-xs uppercase tracking-wider">Repas anti-gaspi</span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">{repasAntiGaspi.description}</p>
              <a href={repasAntiGaspi.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/8 transition">
                {repasAntiGaspi.nom} <ExternalLink size={11} />
              </a>
            </section>
          )}

          <section className="glass rounded-3xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-cyan-300">
              <Bus size={18} />
              <span className="text-xs uppercase tracking-wider">Villes à transports gratuits</span>
            </div>
            <div className="space-y-2">
              {villesTransportGratuit.map((v) => (
                <div key={v.ville} className="border-b border-white/5 pb-2 last:border-0">
                  <p className="text-sm font-semibold">{v.ville}, {v.pays} <span className="text-white/35 font-normal">— gratuit depuis {v.depuis}</span></p>
                  <p className="text-xs text-white/55 mt-0.5">{v.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="glass rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-violet-300">
              <Calculator size={18} />
              <span className="text-xs uppercase tracking-wider">Calculateur de pass touristique</span>
            </div>
            <form onSubmit={handleCalculer} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Ville (optionnel)" value={ville} onChange={(e) => setVille(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm" />
                <input type="number" min={0} placeholder="Prix du pass (€)" value={prixPass} onChange={(e) => setPrixPass(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm" />
              </div>
              {activites.map((a, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" placeholder="Activité incluse" value={a.nom} onChange={(e) => updateActivite(i, 'nom', e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs" />
                  <input type="number" min={0} placeholder="Prix seul (€)" value={a.prixEur} onChange={(e) => updateActivite(i, 'prixEur', e.target.value)} className="w-28 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs" />
                  {activites.length > 1 && (
                    <button type="button" onClick={() => setActivites((prev) => prev.filter((_, idx) => idx !== i))} className="text-white/30 hover:text-rose-300 transition">
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setActivites((prev) => [...prev, { nom: '', prixEur: '' }])} className="flex items-center gap-1 text-xs text-white/50 hover:text-white/75 transition">
                <Plus size={13} /> Ajouter une activité
              </button>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-violet-400 to-cyan-400 text-black font-semibold rounded-xl py-3 text-sm disabled:opacity-50">
                {loading ? 'Calcul…' : 'Calculer la rentabilité'}
              </button>
            </form>

            {result && (
              <div className={`rounded-xl p-4 ${result.rentable ? 'bg-emerald-400/10 border border-emerald-400/30' : 'bg-rose-400/10 border border-rose-400/30'}`}>
                <p className="text-sm font-semibold">
                  {result.rentable ? '✅ Rentable' : '❌ Pas rentable'} : {result.rentable ? 'économise' : 'coûte'} {formatPrice(Math.abs(result.economieEur))} vs à l&apos;unité ({formatPrice(result.totalIndividuelEur)})
                </p>
              </div>
            )}
          </section>

          <section className="glass rounded-2xl p-5 flex items-center gap-4">
            <Camera size={20} className="text-amber-300 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Missions rémunérées locales</h3>
              <p className="text-xs text-white/55 mt-0.5">Photos pour commerces, vérifications terrain — via l&apos;écosystème KARMA/VIDA JOB.</p>
            </div>
            <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 flex-shrink-0">Bientôt</span>
          </section>
        </div>
      </main>
    </>
  )
}
