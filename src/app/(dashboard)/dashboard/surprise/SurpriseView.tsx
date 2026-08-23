'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { SurpriseResultCard } from '@/components/surprise/SurpriseResult'

type SurpriseResult = {
  destination: {
    id: string
    slug: string
    title: string
    category: string
    city: string
    prix: number
    description: string | null
    url_official: string | null
    distance_km: number | null
  }
  trajet: {
    label: string
    mode_dominant: string
    distance_km: number
    duration_min: number
    cost_eur: number
    co2_avoided_kg: number
    gain_credits_eur: number
    apaisement_score: number
  } | null
  micro_defi: {
    texte: string
    emoji: string
    categorie: string
  }
}

export function SurpriseView() {
  const searchParams = useSearchParams()

  // Initialise depuis query params ou défauts
  const [rayon, setRayon] = useState(() => {
    const rayonParam = searchParams?.get('rayon')
    if (rayonParam) {
      const r = Number(rayonParam)
      if (r >= 5 && r <= 100) return r
    }
    return 20
  })

  const [budget, setBudget] = useState<0 | 5 | 10>(() => {
    const budgetParam = searchParams?.get('budget')
    if (budgetParam && ['0', '5', '10'].includes(budgetParam)) {
      return Number(budgetParam) as 0 | 5 | 10
    }
    return 0
  })

  const [duree, setDuree] = useState<'2h' | 'demi_journee' | 'weekend'>(() => {
    const dureeParam = searchParams?.get('duree')
    if (dureeParam && ['2h', 'demi_journee', 'weekend'].includes(dureeParam)) {
      return dureeParam as '2h' | 'demi_journee' | 'weekend'
    }
    return '2h'
  })

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SurpriseResult | null>(null)
  const [geolocationError, setGeolocationError] = useState(false)

  async function handleSurprise() {
    setLoading(true)
    setResult(null)
    setGeolocationError(false)

    // Géolocalisation
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non disponible')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        try {
          const res = await fetch('/api/yatra/surprise', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rayon_km: rayon,
              budget_eur: budget.toString(),
              duree,
              user_lat: latitude,
              user_lon: longitude,
            }),
          })

          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            toast.error(data?.error ?? 'Erreur')
            setLoading(false)
            return
          }

          const data: SurpriseResult = await res.json()
          setResult(data)
          setLoading(false)
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Erreur')
          setLoading(false)
        }
      },
      () => {
        setGeolocationError(true)
        toast.error('Impossible de te localiser. Active la géolocalisation.')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <Sparkles size={32} className="text-violet-400" />
          <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Surprise parfaite
          </h1>
        </div>
        <p className="text-white/60 text-lg max-w-2xl mx-auto">
          Une destination proche + trajet minimal + activité gratuite + micro-défi positif.
          <br />
          <span className="text-emerald-400">En 10 secondes.</span>
        </p>
      </div>

      {/* Formulaire */}
      <div className="glass rounded-3xl p-8 mb-8 bg-gradient-to-br from-violet-500/10 to-emerald-500/10">
        <div className="space-y-6">
          {/* Rayon */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Rayon maximal : <span className="text-emerald-400">{rayon} km</span>
            </label>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={rayon}
              onChange={(e) => setRayon(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-white/40 mt-1">
              <span>5 km</span>
              <span>100 km</span>
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium mb-3">Budget</label>
            <div className="grid grid-cols-3 gap-3">
              {([0, 5, 10] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBudget(b)}
                  className={`px-4 py-3 rounded-2xl font-medium text-sm transition ${
                    budget === b
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {b === 0 ? 'Gratuit' : `≤ ${b}€`}
                </button>
              ))}
            </div>
          </div>

          {/* Durée */}
          <div>
            <label className="block text-sm font-medium mb-3">Durée</label>
            <div className="grid grid-cols-3 gap-3">
              {(['2h', 'demi_journee', 'weekend'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuree(d)}
                  className={`px-4 py-3 rounded-2xl font-medium text-sm transition ${
                    duree === d
                      ? 'bg-violet-500 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {d === '2h' ? '2 heures' : d === 'demi_journee' ? 'Demi-journée' : 'Week-end'}
                </button>
              ))}
            </div>
          </div>

          {/* Bouton */}
          <button
            type="button"
            onClick={handleSurprise}
            disabled={loading || geolocationError}
            className="w-full px-6 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-emerald-500 hover:from-violet-400 hover:to-emerald-400 text-white font-semibold text-lg transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                <span>Magie en cours…</span>
              </>
            ) : (
              <>
                <Sparkles size={24} />
                <span>Surprends-moi</span>
              </>
            )}
          </button>

          {geolocationError && (
            <p className="text-center text-sm text-amber-400">
              Active la géolocalisation pour découvrir la surprise.
            </p>
          )}
        </div>
      </div>

      {/* Résultat */}
      {result && <SurpriseResultCard result={result} />}
    </div>
  )
}
