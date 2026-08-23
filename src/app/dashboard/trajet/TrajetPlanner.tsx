'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, Sparkles, Leaf, Clock, EuroIcon } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import type { GeocodeResult, RouteCombination } from '@/types/trip'
import { PlaceSearch } from './components/PlaceSearch'
import { CombinationCard } from './components/CombinationCard'
import { SortButton } from './components/SortButton'

type Place = GeocodeResult & { __key?: string }

export function TrajetPlanner({
  email,
  villePrincipale,
}: {
  email: string
  villePrincipale: string | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [from, setFrom] = useState<Place | null>(null)
  const [to, setTo] = useState<Place | null>(null)
  const [combinations, setCombinations] = useState<RouteCombination[]>([])
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [starting, setStarting] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'prix' | 'duree' | 'co2' | 'points'>('prix')

  // Préremplir destination depuis query params (routeur NLU)
  const toQueryHint = searchParams?.get('to') ?? null

  const compute = useCallback(async (f: Place, t: Place) => {
    setLoadingRoute(true)
    try {
      const r = await fetch('/api/vida/trip/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: { label: f.label, lat: f.lat, lon: f.lon },
          to: { label: t.label, lat: t.lat, lon: t.lon },
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Calcul impossible')
      setCombinations(data.combinations as RouteCombination[])
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur réseau')
    } finally {
      setLoadingRoute(false)
    }
  }, [])

  const handleStart = useCallback(
    async (combo: RouteCombination) => {
      if (!from || !to) return
      setStarting(combo.id)
      try {
        const r = await fetch('/api/vida/trip/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            declared_mode: combo.mode_dominant,
            from_label: from.label,
            to_label: to.label,
            from_lat: from.lat,
            from_lon: from.lon,
            to_lat: to.lat,
            to_lon: to.lon,
          }),
        })
        const data = await r.json()
        if (!r.ok) throw new Error(data?.error ?? 'Impossible de démarrer')
        router.push(`/dashboard/trajet/active?id=${data.trip_id}&mode=${combo.mode_dominant}&dist=${combo.distance_km}`)
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : 'Erreur')
        setStarting(null)
      }
    },
    [from, to, router],
  )

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-4xl mx-auto flex items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="Retour"
            className="text-white/60 hover:text-white transition flex items-center gap-1.5"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Retour</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Nouveau trajet
          </h1>
          <span className="ml-auto text-xs text-white/40">{email}</span>
        </header>

        <div className="px-6 pb-16 max-w-4xl mx-auto space-y-6">
          <section className="glass rounded-2xl p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white/80">Où vas-tu&nbsp;?</h2>
            <PlaceSearch
              label="Départ"
              placeholder={villePrincipale ? `Ex. ${villePrincipale}, ma maison…` : 'Adresse de départ'}
              value={from}
              onChange={setFrom}
              autoFillLast
            />
            <PlaceSearch
              label="Destination"
              placeholder="Adresse, lieu, gare…"
              value={to}
              onChange={setTo}
              queryHint={toQueryHint}
            />
            <button
              type="button"
              disabled={!from || !to || loadingRoute}
              onClick={() => from && to && compute(from, to)}
              className="btn-primary w-full justify-center"
            >
              {loadingRoute ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              Calculer les options
            </button>
          </section>

          {combinations.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-4 px-1">
                <h2 className="text-sm font-semibold text-white/80">Choisis ton trajet</h2>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-white/40 uppercase tracking-wider">Trier par</span>
                  <div className="flex gap-1">
                    <SortButton
                      active={sortBy === 'prix'}
                      onClick={() => setSortBy('prix')}
                      label="Prix"
                      icon={<EuroIcon size={11} />}
                    />
                    <SortButton
                      active={sortBy === 'duree'}
                      onClick={() => setSortBy('duree')}
                      label="Durée"
                      icon={<Clock size={11} />}
                    />
                    <SortButton
                      active={sortBy === 'co2'}
                      onClick={() => setSortBy('co2')}
                      label="CO₂"
                      icon={<Leaf size={11} />}
                    />
                    <SortButton
                      active={sortBy === 'points'}
                      onClick={() => setSortBy('points')}
                      label="Points"
                      icon={<Sparkles size={11} />}
                    />
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {[...combinations]
                  .sort((a, b) => {
                    if (sortBy === 'prix') return a.cost_eur - b.cost_eur
                    if (sortBy === 'duree') return a.duration_min - b.duration_min
                    if (sortBy === 'co2') return b.co2_avoided_kg - a.co2_avoided_kg // desc (plus = mieux)
                    if (sortBy === 'points') return b.gain_credits_eur - a.gain_credits_eur // desc (plus = mieux)
                    return 0
                  })
                  .map((c, idx) => (
                    <CombinationCard
                      key={c.id}
                      combo={c}
                      rank={idx + 1}
                      sortBy={sortBy}
                      onStart={() => handleStart(c)}
                      starting={starting === c.id}
                      disabled={!!starting && starting !== c.id}
                    />
                  ))}
              </div>
              <p className="text-[11px] text-white/35 px-1">
                Anti-fraude actif&nbsp;: la trace GPS est analysée à l&apos;arrivée pour confirmer le mode déclaré.
              </p>
            </section>
          )}
        </div>
      </main>
    </>
  )
}
