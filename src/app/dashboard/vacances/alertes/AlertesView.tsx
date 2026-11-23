'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BellRing, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice } from '@/lib/utils'
import { safeDealUrl } from '@/lib/vacances/alertes'
import type { AlertConfig, AlertNotification } from '@/lib/vacances/alertes-types'
import { AlertDealCard } from './AlertDealCard'
import { useAlertes } from './useAlertes'

const inputClass = 'w-full min-h-11 bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-60'

export function AlertesView({ initialConfigs, initialNotifications, initialError = null }: {
  initialConfigs: AlertConfig[]
  initialNotifications: AlertNotification[]
  initialError?: string | null
}) {
  const alerts = useAlertes({ configs: initialConfigs, notifications: initialNotifications }, initialError)
  const [depart, setDepart] = useState('')
  const [destination, setDestination] = useState('')
  const [budget, setBudget] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const busy = alerts.pending !== null
  const pendingLabel = alerts.pending === 'add' ? 'Enregistrement de l’alerte…'
    : alerts.pending === 'refresh' ? 'Actualisation des alertes…' : 'Suppression de l’alerte…'
  const seenSources = new Set<string>()
  const deals = alerts.notifications.flatMap(({ deal }) => {
    if (!deal) return []
    const sourceKey = safeDealUrl(deal.url) ?? `deal:${deal.id}`
    if (seenSources.has(sourceKey)) return []
    seenSources.add(sourceKey)
    return [deal]
  })

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setFormError(null)
    if (depart.trim().length < 2 || destination.trim().length < 2) {
      setFormError('Renseigne un départ et une destination d’au moins deux caractères.')
      return
    }
    const amount = budget.trim() ? Number(budget) : null
    if (amount !== null && (!Number.isFinite(amount) || amount < 0.01 || amount > 20000)) {
      setFormError('Indique un budget entre 0,01 € et 20 000 €, ou laisse ce champ vide.')
      return
    }
    if (await alerts.addConfig(depart, destination, amount)) {
      setDepart('')
      setDestination('')
      setBudget('')
    }
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-3xl mx-auto flex flex-wrap items-center gap-3">
          <Link href="/dashboard/vacances" aria-label="Retour aux vacances" className="min-h-11 text-white/70 hover:text-white transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded-lg">
            <ArrowLeft aria-hidden="true" size={18} /><span className="text-sm">Retour</span>
          </Link>
          <h1 className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Alertes bons plans</h1>
        </header>

        <div className="px-6 pb-24 max-w-3xl mx-auto space-y-6">
          <section className="glass rounded-3xl p-6 space-y-3" aria-labelledby="veille-title">
            <h2 id="veille-title" className="flex items-center gap-2 text-amber-200 text-sm font-semibold">
              <BellRing aria-hidden="true" size={18} /> Des pistes de voyage selon tes critères
            </h2>
            <p className="text-sm text-white/70 leading-relaxed">
              La veille quotidienne recherche des bons plans publiés sur le web. Chaque piste garde sa source ; un prix mentionné peut avoir changé ou ne plus être disponible.
              Confirme le tarif complet et les conditions auprès du vendeur avant de réserver.
            </p>
            <p className="text-xs text-white/60 leading-relaxed">Une erreur de tarif peut être annulée par la compagnie. Attends la confirmation du billet avant de réserver un hôtel non remboursable.</p>
          </section>

          <div className="space-y-3">
            <button type="button" onClick={() => { setFormError(null); void alerts.refresh() }} disabled={busy} className="min-h-11 px-4 py-2 border border-white/20 rounded-xl inline-flex items-center gap-2 text-sm hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-50">
              <RefreshCw aria-hidden="true" size={16} />{alerts.pending === 'refresh' ? 'Actualisation…' : 'Actualiser les alertes'}
            </button>
            {alerts.loadError && <p role="alert" className="text-sm text-rose-200">{alerts.loadError}</p>}
            {alerts.error && <p role="alert" className="text-sm text-rose-200">{alerts.error}</p>}
            <p role="status" aria-live="polite" aria-atomic="true" className="text-sm text-emerald-200">{busy ? pendingLabel : alerts.message}</p>
          </div>

          <form onSubmit={handleAdd} className="glass rounded-3xl p-6 space-y-4" aria-labelledby="create-alert-title" aria-busy={alerts.pending === 'add'}>
            <h2 id="create-alert-title" className="font-semibold">Créer une alerte</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="vacances-depart" className="block text-sm text-white/80">Aéroport ou ville de départ</label>
                <input id="vacances-depart" name="depart" type="text" required minLength={2} maxLength={80} value={depart} onChange={(event) => setDepart(event.target.value)} placeholder="Ex. Genève ou GVA" disabled={busy} className={inputClass} />
              </div>
              <div className="space-y-2">
                <label htmlFor="vacances-destination" className="block text-sm text-white/80">Destination souhaitée</label>
                <input id="vacances-destination" name="destination" type="text" required minLength={2} maxLength={80} value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Ex. Tokyo" disabled={busy} className={inputClass} />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="vacances-budget" className="block text-sm text-white/80">Budget maximal en euros <span className="text-white/60">(facultatif)</span></label>
              <input id="vacances-budget" name="budget" type="number" min={0.01} max={20000} step={0.01} inputMode="decimal" value={budget} onChange={(event) => setBudget(event.target.value)} aria-describedby="vacances-budget-help" disabled={busy} className={inputClass} />
              <p id="vacances-budget-help" className="text-xs text-white/60">Ce filtre porte sur le prix mentionné dans la source. Les bagages et autres frais restent à vérifier.</p>
            </div>
            {formError && <p role="alert" className="text-sm text-rose-200">{formError}</p>}
            <button type="submit" disabled={busy} className="w-full min-h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 text-black font-semibold rounded-xl py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50">
              <Plus aria-hidden="true" size={16} />{alerts.pending === 'add' ? 'Enregistrement…' : 'Créer cette alerte'}
            </button>
          </form>

          <section className="space-y-3" aria-labelledby="configs-title">
            <h2 id="configs-title" className="text-sm font-semibold text-white/80">Mes alertes ({alerts.configs.length})</h2>
            {alerts.configs.length === 0 ? (
              <p className="text-sm text-white/60">{alerts.loadError ? 'Actualise pour retrouver tes alertes enregistrées.' : 'Choisis un départ et une destination pour créer ta première alerte.'}</p>
            ) : alerts.configs.map((config) => (
              <div key={config.id} className="glass rounded-xl p-3 flex items-center justify-between gap-3">
                <p className="text-sm min-w-0 break-words">
                  {config.aeroport_depart} → {config.destination_souhaitee}
                  {config.budget_max_eur != null && <span className="block text-white/65">Budget : {formatPrice(config.budget_max_eur)}</span>}
                  {!config.actif && <span className="block text-white/65">En pause</span>}
                </p>
                <button type="button" onClick={() => void alerts.removeConfig(config.id)} disabled={busy} aria-label={`Supprimer l’alerte ${config.aeroport_depart} vers ${config.destination_souhaitee}`} className="min-h-11 min-w-11 px-3 rounded-lg text-white/70 hover:text-rose-200 transition flex-shrink-0 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-50">
                  <Trash2 aria-hidden="true" size={18} />{alerts.pending === `delete:${config.id}` && <span className="text-xs">Suppression…</span>}
                </button>
              </div>
            ))}
          </section>

          <section className="space-y-3" aria-labelledby="deals-title">
            <h2 id="deals-title" className="text-sm font-semibold text-white/80">Pistes détectées ({deals.length})</h2>
            {deals.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-center text-sm text-white/65">
                {alerts.loadError ? 'Les résultats ne peuvent pas encore être chargés.' : 'Aucune piste affichée pour le moment. Les prochaines recherches peuvent faire apparaître de nouvelles offres.'}
              </div>
            ) : deals.map((deal) => <AlertDealCard key={deal.id} deal={deal} />)}
          </section>
        </div>
      </main>
    </>
  )
}
