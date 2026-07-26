'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Wallet, Plus, ChevronRight } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice } from '@/lib/utils'
import { progressPct } from '@/lib/vacances/cagnotte'

type Cagnotte = { id: string; titre: string; destination: string | null; objectif_eur: number; montant_actuel_eur: number; statut: 'active' | 'cloturee' }

export function CagnotteListView({ initialCagnottes }: { initialCagnottes: Cagnotte[] }) {
  const [cagnottes, setCagnottes] = useState<Cagnotte[]>(initialCagnottes)
  const [titre, setTitre] = useState('')
  const [destination, setDestination] = useState('')
  const [objectif, setObjectif] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!titre || !objectif || Number(objectif) <= 0) {
      setError('Renseigne un titre et un objectif.')
      return
    }
    setLoading(true)
    try {
      const r = await fetch('/api/vacances/cagnotte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titre, destination: destination || null, objectif_eur: Number(objectif) }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Erreur')
      setCagnottes((prev) => [data.cagnotte, ...prev])
      setTitre(''); setDestination(''); setObjectif(''); setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
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
            Cagnotte yatrage
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-6">
          <section className="glass rounded-3xl p-6 space-y-2">
            <div className="flex items-center gap-2 text-amber-300">
              <Wallet size={18} />
              <span className="text-xs uppercase tracking-wider">Tes proches cotisent, ça part sur ton wallet YATRA</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Crée une cagnotte pour ton prochain voyage, partage le lien — pas besoin de compte YATRA pour contribuer.
            </p>
          </section>

          {!showForm ? (
            <button type="button" onClick={() => setShowForm(true)} className="w-full flex items-center justify-center gap-2 glass rounded-2xl p-4 text-sm font-medium hover:border-amber-400/30 transition">
              <Plus size={16} /> Créer une cagnotte
            </button>
          ) : (
            <form onSubmit={handleCreate} className="glass rounded-3xl p-6 space-y-3">
              <input type="text" placeholder="Titre (ex : Voyage à Lisbonne)" value={titre} onChange={(e) => setTitre(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Destination (optionnel)" value={destination} onChange={(e) => setDestination(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm" />
                <input type="number" min={1} placeholder="Objectif (€)" value={objectif} onChange={(e) => setObjectif(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm" />
              </div>
              {error && <p className="text-sm text-rose-300">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-black font-semibold rounded-xl py-3 text-sm disabled:opacity-50">
                {loading ? 'Création…' : 'Créer'}
              </button>
            </form>
          )}

          <section className="space-y-3">
            {cagnottes.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center space-y-2">
                <p className="text-4xl">🐷</p>
                <p className="text-white/65 text-sm">Aucune cagnotte pour l&apos;instant.</p>
              </div>
            ) : (
              cagnottes.map((c) => (
                <Link key={c.id} href={`/dashboard/vacances/cagnotte/${c.id}`} className="glass rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-amber-400/30 transition">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm">{c.titre}{c.destination && <span className="text-white/40"> · {c.destination}</span>}</h3>
                    <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400" style={{ width: `${progressPct(c.montant_actuel_eur, c.objectif_eur)}%` }} />
                    </div>
                    <p className="text-xs text-white/50 mt-1">{formatPrice(c.montant_actuel_eur)} / {formatPrice(c.objectif_eur)}</p>
                  </div>
                  <ChevronRight size={18} className="text-white/30 flex-shrink-0" />
                </Link>
              ))
            )}
          </section>
        </div>
      </main>
    </>
  )
}
