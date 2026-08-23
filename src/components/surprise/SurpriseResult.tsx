import Link from 'next/link'
import { MapPin, Navigation, Euro, Clock, Leaf, TrendingUp, ArrowRight, Sparkles } from 'lucide-react'

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

export function SurpriseResultCard({ result }: { result: SurpriseResult }) {
  return (
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Metric icon={<Navigation size={16} />} label="Distance" value={`${Math.round(result.trajet.distance_km)} km`} />
              <Metric icon={<Clock size={16} />} label="Durée" value={`${Math.round(result.trajet.duration_min)} min`} />
              <Metric icon={<Euro size={16} />} label="Coût" value={`${result.trajet.cost_eur.toFixed(2)}€`} />
              <Metric icon={<Leaf size={16} />} label="CO₂ évité" value={`${result.trajet.co2_avoided_kg.toFixed(1)} kg`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric icon={<TrendingUp size={16} />} label="Gain crédits" value={`${result.trajet.gain_credits_eur.toFixed(2)}€`} />
              <Metric icon={<Sparkles size={16} />} label="Apaisement" value={`${result.trajet.apaisement_score}/10`} />
            </div>
          </div>
        </div>
      )}

      {/* Micro-défi */}
      <div className="glass rounded-3xl p-6 bg-gradient-to-br from-violet-500/10 to-emerald-500/10">
        <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="text-2xl">{result.micro_defi.emoji}</span>
          <span>Micro-défi {result.micro_defi.categorie}</span>
        </h4>
        <p className="text-white/70 text-sm">{result.micro_defi.texte}</p>
      </div>
    </div>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
      <div className="text-white/40">{icon}</div>
      <div className="flex-1">
        <p className="text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}
