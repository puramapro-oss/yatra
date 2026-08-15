'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, Loader2, MapPin, Navigation, Euro, Clock, Leaf, TrendingUp, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

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
  const [rayon, setRayon] = useState(20)
  const [budget, setBudget] = useState<0 | 5 | 10>(0)
  const [duree, setDuree] = useState<'2h' | 'demi_journee' | 'weekend'>('2h')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SurpriseResult | null>(null)
  const [geolocationError, setGeolocationError] = useState(false)

  // Lire les query params pour pré-remplir le formulaire (depuis NLU search)
  useEffect(() => {
    const rayonParam = searchParams?.get('rayon')
    const budgetParam = searchParams?.get('budget')
    const dureeParam = searchParams?.get('duree')

    if (rayonParam) {
      const r = Number(rayonParam)
      if (r >= 5 && r <= 100) setRayon(r)
    }
    if (budgetParam && ['0', '5', '10'].includes(budgetParam)) {
      setBudget(Number(budgetParam) as 0 | 5 | 10)
    }
    if (dureeParam && ['2h', 'demi_journee', 'weekend'].includes(dureeParam)) {
      setDuree(dureeParam as '2h' | 'demi_journee' | 'weekend')
    }
  }, [searchParams])

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
      {result && (
        <div className="space-y-6 animate-in fade-in duration-700">
          {/* Destination */}
          <div className="glass rounded-3xl p-6 bg-gradient-to-br from-emerald-500/10 to-violet-500/10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <MapPin size={24} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    {result.destination.title}
                  </h3>
                  <p className="text-sm text-white/60">
                    {result.destination.city} · {result.destination.category}
                    {result.destination.distance_km != null && (
                      <> · {Math.round(result.destination.distance_km)} km</>
                    )}
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-medium">
                {result.destination.prix === 0 ? 'Gratuit' : `${result.destination.prix}€`}
              </div>
            </div>

            {result.destination.description && (
              <p className="text-white/70 text-sm mb-4">{result.destination.description}</p>
            )}

            <div className="flex gap-3">
              {result.trajet && (
                <Link
                  href={`/dashboard/trajet?to=${encodeURIComponent(result.destination.city)}`}
                  className="flex-1 px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm transition flex items-center justify-center gap-2"
                >
                  <Navigation size={16} />
                  <span>Voir le trajet</span>
                </Link>
              )}
              {result.destination.url_official && (
                <a
                  href={result.destination.url_official}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/80 font-medium text-sm transition flex items-center justify-center gap-2"
                >
                  <ArrowRight size={16} />
                  <span>Site officiel</span>
                </a>
              )}
            </div>
          </div>

          {/* Trajet */}
          {result.trajet && (
            <div className="glass rounded-3xl p-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Navigation size={20} className="text-violet-400" />
                <span>Trajet minimal</span>
              </h4>
              <div className="space-y-3">
                <div className="text-sm text-white/80">
                  <span className="font-medium">{result.trajet.label}</span> · Mode dominant :{' '}
                  <span className="text-emerald-400">{result.trajet.mode_dominant}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Euro size={16} className="text-white/40" />
                    <div>
                      <div className="text-xs text-white/50">Prix</div>
                      <div className="font-semibold text-sm">{result.trajet.cost_eur.toFixed(2)}€</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-white/40" />
                    <div>
                      <div className="text-xs text-white/50">Durée</div>
                      <div className="font-semibold text-sm">{Math.round(result.trajet.duration_min)} min</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Leaf size={16} className="text-emerald-400" />
                    <div>
                      <div className="text-xs text-white/50">CO₂ évité</div>
                      <div className="font-semibold text-sm">{result.trajet.co2_avoided_kg.toFixed(2)} kg</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-violet-400" />
                    <div>
                      <div className="text-xs text-white/50">Gain</div>
                      <div className="font-semibold text-sm">{result.trajet.gain_credits_eur.toFixed(2)}€</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Micro-défi */}
          <div className="glass rounded-3xl p-6 bg-gradient-to-br from-violet-500/10 to-pink-500/10">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles size={20} className="text-pink-400" />
              <span>Micro-défi positif</span>
            </h4>
            <div className="flex items-center gap-4">
              <div className="text-5xl">{result.micro_defi.emoji}</div>
              <div>
                <p className="text-lg text-white/90 font-medium">{result.micro_defi.texte}</p>
                <p className="text-xs text-white/50 mt-1">Catégorie : {result.micro_defi.categorie}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
