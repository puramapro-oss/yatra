'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, MapPin, Search, Loader2, Sparkles, Leaf, Wind, Clock, EuroIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { MOBILITY_LABELS, MOBILITY_EMOJI } from '@/types/vida'
import type { GeocodeResult, RouteCombination } from '@/types/trip'

type Place = GeocodeResult & { __key?: string }

export function TrajetPlanner({
  email,
  villePrincipale,
}: {
  email: string
  villePrincipale: string | null
}) {
  const router = useRouter()
  const [from, setFrom] = useState<Place | null>(null)
  const [to, setTo] = useState<Place | null>(null)
  const [combinations, setCombinations] = useState<RouteCombination[]>([])
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [starting, setStarting] = useState<string | null>(null)

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
              <h2 className="text-sm font-semibold text-white/80 px-1">Choisis ton trajet</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {combinations.map((c) => (
                  <CombinationCard
                    key={c.id}
                    combo={c}
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

function PlaceSearch({
  label,
  placeholder,
  value,
  onChange,
  autoFillLast,
}: {
  label: string
  placeholder: string
  value: Place | null
  onChange: (p: Place | null) => void
  autoFillLast?: boolean
}) {
  const [query, setQuery] = useState(value?.label ?? '')
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([])
      return
    }
    setSearching(true)
    try {
      const r = await fetch(`/api/vida/geocode?q=${encodeURIComponent(q)}`)
      const d = await r.json()
      setSuggestions((d.results as GeocodeResult[]) ?? [])
      setOpen(true)
    } catch {
      setSuggestions([])
    } finally {
      setSearching(false)
    }
  }, [])

  const handleGeolocate = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Géolocalisation indisponible')
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        const place: Place = { label: 'Ma position actuelle', lat, lon }
        onChange(place)
        setQuery(place.label)
      },
      () => toast.error('Position refusée'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  return (
    <div className="relative">
      <label className="block text-xs uppercase tracking-wider text-white/40 mb-1.5">{label}</label>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
          <input
            type="text"
            value={query}
            placeholder={placeholder}
            onChange={(e) => {
              setQuery(e.target.value)
              search(e.target.value)
              if (!e.target.value) onChange(null)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:border-emerald-400/50 focus:outline-none transition"
          />
          {open && suggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-[#0d0d12] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
              {suggestions.map((s, i) => (
                <button
                  key={`${s.lat}-${s.lon}-${i}`}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange({ ...s })
                    setQuery(s.label)
                    setOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 border-b border-white/5 last:border-0 transition"
                >
                  <span className="text-white/80 line-clamp-1">{s.label}</span>
                </button>
              ))}
            </div>
          )}
          {searching && (
            <Loader2
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 animate-spin"
            />
          )}
        </div>
        <button
          type="button"
          onClick={handleGeolocate}
          aria-label="Utiliser ma position"
          className="px-3 py-2.5 rounded-xl border border-white/10 hover:border-emerald-400/40 hover:bg-emerald-400/5 transition text-white/70 hover:text-white"
          title="Ma position"
        >
          <MapPin size={16} />
        </button>
      </div>
      {value && value.label !== 'Ma position actuelle' && (
        <p className="text-[11px] text-emerald-400/70 mt-1.5">✓ {value.label.split(',').slice(0, 2).join(',')}</p>
      )}
      {autoFillLast && null}
    </div>
  )
}

function CombinationCard({
  combo,
  onStart,
  starting,
  disabled,
}: {
  combo: RouteCombination
  onStart: () => void
  starting: boolean
  disabled: boolean
}) {
  const isClean = combo.tags.includes('cleanest')
  const isCheap = combo.tags.includes('cheapest')
  const isApais = combo.tags.includes('apaisant')

  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-3 hover:border-emerald-400/30 transition">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{MOBILITY_EMOJI[combo.mode_dominant]}</span>
          <h3 className="font-semibold text-sm leading-tight">{combo.label}</h3>
        </div>
        <div className="flex flex-wrap gap-1 justify-end">
          {isCheap && <Tag color="amber">💸 Moins cher</Tag>}
          {isClean && <Tag color="emerald">🌿 Plus propre</Tag>}
          {isApais && <Tag color="violet">🧘 Apaisant</Tag>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat icon={<EuroIcon size={12} />} label="Coût" value={`${combo.cost_eur.toFixed(2)} €`} />
        <Stat icon={<Clock size={12} />} label="Durée" value={`${Math.round(combo.duration_min)} min`} />
        <Stat icon={<Leaf size={12} />} label="CO₂ évité" value={`${combo.co2_avoided_kg.toFixed(2)} kg`} />
        <Stat
          icon={<Sparkles size={12} />}
          label="Tu gagnes"
          value={combo.gain_credits_eur > 0 ? `+ ${combo.gain_credits_eur.toFixed(2)} €` : '—'}
          highlight={combo.gain_credits_eur > 0}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-white/35">
          <Wind size={11} className="inline mr-1" />
          Apaisement {combo.apaisement_score.toFixed(1)}/10
        </span>
        <button
          type="button"
          onClick={onStart}
          disabled={disabled || starting}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-black text-xs font-semibold disabled:opacity-50 hover:scale-[1.02] active:scale-95 transition"
        >
          {starting ? <Loader2 className="animate-spin inline" size={12} /> : 'Démarrer'}
        </button>
      </div>

      {combo.steps.length > 1 && (
        <div className="border-t border-white/5 pt-2 flex flex-wrap gap-1.5 text-[10px] text-white/45">
          {combo.steps.map((s, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded bg-white/5">
              {MOBILITY_EMOJI[s.mode]} {MOBILITY_LABELS[s.mode]} {s.distance_km}km
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={`rounded-lg px-2.5 py-1.5 ${highlight ? 'bg-emerald-400/10 border border-emerald-400/30' : 'bg-white/3 border border-white/5'}`}>
      <div className="flex items-center gap-1 text-white/50 text-[10px] uppercase tracking-wider">
        {icon} {label}
      </div>
      <div className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-emerald-300' : 'text-white/85'}`}>
        {value}
      </div>
    </div>
  )
}

function Tag({ color, children }: { color: 'emerald' | 'amber' | 'violet'; children: React.ReactNode }) {
  const cls = {
    emerald: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
    amber: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    violet: 'bg-violet-400/15 text-violet-300 border-violet-400/30',
  }[color]
  return (
    <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${cls}`}>
      {children}
    </span>
  )
}
