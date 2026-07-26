'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BellRing, Plus, Trash2, ExternalLink, AlertTriangle } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice } from '@/lib/utils'

type Config = {
  id: string
  aeroport_depart: string
  destination_souhaitee: string
  budget_max_eur: number | null
  actif: boolean
}

type Deal = { id: string; titre: string; url: string; extrait: string | null; prix_detecte_eur: number | null; destination_matched: string | null }
type Notification = { id: string; created_at: string; deal: Deal }

export function AlertesView({ initialConfigs, initialNotifications }: { initialConfigs: Config[]; initialNotifications: Notification[] }) {
  const [configs, setConfigs] = useState<Config[]>(initialConfigs)
  const [notifications] = useState<Notification[]>(initialNotifications)
  const [depart, setDepart] = useState('')
  const [destination, setDestination] = useState('')
  const [budget, setBudget] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!depart || !destination) {
      setError('Renseigne un aéroport de départ et une destination.')
      return
    }
    setLoading(true)
    try {
      const r = await fetch('/api/vacances/alertes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aeroport_depart: depart, destination_souhaitee: destination, budget_max_eur: budget ? Number(budget) : null }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? 'Erreur')
      setConfigs((prev) => [data.config, ...prev])
      setDepart(''); setDestination(''); setBudget('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  async function removeConfig(id: string) {
    const r = await fetch(`/api/vacances/alertes/${id}`, { method: 'DELETE' })
    if (r.ok) setConfigs((prev) => prev.filter((c) => c.id !== id))
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
            Alertes bons plans
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-6">
          <section className="glass rounded-3xl p-6 space-y-2">
            <div className="flex items-center gap-2 text-amber-300">
              <BellRing size={18} />
              <span className="text-xs uppercase tracking-wider">Veille quotidienne, jamais un prix inventé</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              On surveille le web pour toi et on ne t&apos;alerte que sur des bons plans réellement publiés
              (source + lien à l&apos;appui). Une erreur de tarif peut être annulée par la compagnie à tout
              moment : ne réserve rien d&apos;autre (hôtel non remboursable) avant confirmation du billet.
            </p>
          </section>

          <form onSubmit={handleAdd} className="glass rounded-3xl p-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Aéroport de départ"
                value={depart}
                onChange={(e) => setDepart(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400/40"
              />
              <input
                type="text"
                placeholder="Destination rêvée"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400/40"
              />
            </div>
            <input
              type="number"
              min={0}
              placeholder="Budget max (€, optionnel)"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400/40"
            />
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 text-black font-semibold rounded-xl py-3 text-sm disabled:opacity-50">
              <Plus size={16} /> {loading ? 'Ajout…' : 'Créer cette alerte'}
            </button>
          </form>

          {configs.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs uppercase tracking-wider text-white/50">Mes alertes actives</h2>
              {configs.map((c) => (
                <div key={c.id} className="glass rounded-xl p-3 flex items-center justify-between gap-3">
                  <span className="text-sm">
                    {c.aeroport_depart} → {c.destination_souhaitee}
                    {c.budget_max_eur != null && <span className="text-white/40"> · max {formatPrice(c.budget_max_eur)}</span>}
                  </span>
                  <button type="button" onClick={() => removeConfig(c.id)} className="text-white/40 hover:text-rose-300 transition flex-shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-wider text-white/50">Bons plans détectés</h2>
            {notifications.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center space-y-2">
                <p className="text-4xl">📡</p>
                <p className="text-white/65 text-sm">Rien détecté pour l&apos;instant — la veille tourne quotidiennement.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <a
                  key={n.id}
                  href={n.deal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass rounded-2xl p-4 flex items-start gap-3 hover:border-amber-400/30 transition"
                >
                  <AlertTriangle size={16} className="text-amber-300 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm line-clamp-2">{n.deal.titre}</h3>
                    {n.deal.extrait && <p className="text-xs text-white/55 mt-1 line-clamp-2">{n.deal.extrait}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      {n.deal.prix_detecte_eur != null && (
                        <span className="text-emerald-300 font-semibold text-sm">{formatPrice(n.deal.prix_detecte_eur)}</span>
                      )}
                      <span className="text-[11px] text-white/40 flex items-center gap-1">
                        <ExternalLink size={10} /> Voir la source
                      </span>
                    </div>
                  </div>
                </a>
              ))
            )}
          </section>
        </div>
      </main>
    </>
  )
}
