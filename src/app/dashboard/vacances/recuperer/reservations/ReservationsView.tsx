'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, TrendingDown, Plus } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice } from '@/lib/utils'

type Reservation = {
  id: string
  label: string
  prix_paye_eur: number
  lien_reservation: string | null
  annulable: boolean
  prix_constate_eur: number | null
  economie_potentielle_eur: number | null
  statut: 'suivi' | 'rebooke' | 'abandonne' | 'expire'
}

export function ReservationsView({ initialReservations }: { initialReservations: Reservation[] }) {
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations)
  const [label, setLabel] = useState('')
  const [prix, setPrix] = useState('')
  const [lien, setLien] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const prixNum = Number(prix)
    if (!label || !prix || Number.isNaN(prixNum)) {
      setError('Renseigne un nom et un prix payé.')
      return
    }
    setLoading(true)
    try {
      const r = await fetch('/api/vacances/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, prix_paye_eur: prixNum, lien_reservation: lien || null, annulable: true }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Erreur')
      setReservations((prev) => [data.reservation, ...prev])
      setLabel(''); setPrix(''); setLien('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  async function checkPrix(id: string, current: Reservation) {
    const nouveau = window.prompt(`Prix constaté aujourd'hui pour "${current.label}" (€) :`, String(current.prix_paye_eur))
    if (nouveau === null) return
    const prixNum = Number(nouveau)
    if (Number.isNaN(prixNum)) return
    const r = await fetch(`/api/vacances/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prix_constate_eur: prixNum }),
    })
    if (r.ok) {
      const data = await r.json()
      setReservations((prev) => prev.map((r2) => (r2.id === id ? data.reservation : r2)))
    }
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard/vacances/recuperer" aria-label="Retour" className="text-white/60 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft size={18} />
            <span className="text-sm">Retour</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Rebooking automatique
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-6">
          <section className="glass rounded-3xl p-6 space-y-2">
            <div className="flex items-center gap-2 text-violet-300">
              <RefreshCw size={18} />
              <span className="text-xs uppercase tracking-wider">Suivi manuel — pas d&apos;alerte automatique en V1</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Ajoute une réservation annulable, on te rappelle de revenir vérifier le prix de temps en temps.
              Si le prix a baissé : annule et re-réserve toi-même (l&apos;économie n&apos;est jamais garantie).
            </p>
          </section>

          <form onSubmit={handleAdd} className="glass rounded-3xl p-6 space-y-3">
            <input
              type="text"
              placeholder="Ex : Hôtel Lisbonne 3 nuits"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400/40"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min={0}
                placeholder="Prix payé (€)"
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400/40"
              />
              <input
                type="text"
                placeholder="Lien (optionnel)"
                value={lien}
                onChange={(e) => setLien(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400/40"
              />
            </div>
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-400 to-cyan-400 text-black font-semibold rounded-xl py-3 text-sm disabled:opacity-50">
              <Plus size={16} /> {loading ? 'Ajout…' : 'Suivre cette réservation'}
            </button>
          </form>

          <section className="space-y-3">
            {reservations.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center space-y-2">
                <p className="text-4xl">📋</p>
                <p className="text-white/65 text-sm">Aucune réservation suivie pour l&apos;instant.</p>
              </div>
            ) : (
              reservations.map((r) => (
                <article key={r.id} className="glass rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{r.label}</h3>
                    <p className="text-xs text-white/55 mt-0.5">
                      Payé {formatPrice(r.prix_paye_eur)}
                      {r.prix_constate_eur != null && <> · Constaté {formatPrice(r.prix_constate_eur)}</>}
                      {r.economie_potentielle_eur != null && r.economie_potentielle_eur > 0 && (
                        <span className="text-emerald-300 flex items-center gap-1 mt-1">
                          <TrendingDown size={11} /> {formatPrice(r.economie_potentielle_eur)} d&apos;économie possible
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => checkPrix(r.id, r)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/8 transition flex-shrink-0"
                  >
                    Vérifier le prix
                  </button>
                </article>
              ))
            )}
          </section>
        </div>
      </main>
    </>
  )
}
