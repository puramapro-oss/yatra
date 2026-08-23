'use client'

import { useState, useCallback } from 'react'
import { Search, Loader2, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import type { GeocodeResult } from '@/types/trip'

type Place = GeocodeResult & { __key?: string }

interface PlaceSearchProps {
  label: string
  placeholder: string
  value: Place | null
  onChange: (p: Place | null) => void
  autoFillLast?: boolean
  queryHint?: string | null
}

export function PlaceSearch({
  label,
  placeholder,
  value,
  onChange,
  autoFillLast,
  queryHint,
}: PlaceSearchProps) {
  const [query, setQuery] = useState(() => value?.label ?? queryHint ?? '')
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
