'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, StopCircle, Loader2, Activity } from 'lucide-react'
import { toast } from 'sonner'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { MOBILITY_LABELS, MOBILITY_EMOJI, type MobilityMode } from '@/types/vida'
import type { GpsPoint } from '@/types/trip'
import { haversineKm } from '@/lib/geo'

export function ActiveTracker() {
  const router = useRouter()
  const params = useSearchParams()
  const tripId = params.get('id')
  const declaredMode = (params.get('mode') ?? 'marche') as MobilityMode
  const targetDistance = Number(params.get('dist') ?? 0)

  const [points, setPoints] = useState<GpsPoint[]>([])
  const [tracking, setTracking] = useState(false)
  const [permError, setPermError] = useState<string | null>(null)
  const [ending, setEnding] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef<number>(Date.now())
  const watchRef = useRef<number | null>(null)

  useEffect(() => {
    if (!tripId) {
      router.replace('/dashboard/trajet')
      return
    }
  }, [tripId, router])

  useEffect(() => {
    if (!tracking) return
    const t = setInterval(() => setElapsed(Date.now() - startRef.current), 1000)
    return () => clearInterval(t)
  }, [tracking])

  function start() {
    if (!('geolocation' in navigator)) {
      setPermError('Géolocalisation non supportée par ce navigateur.')
      return
    }
    startRef.current = Date.now()
    setPoints([])
    setTracking(true)
    setPermError(null)

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p: GpsPoint = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          t: pos.timestamp,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          altitude: pos.coords.altitude,
        }
        setPoints((prev) => {
          const last = prev[prev.length - 1]
          // anti-bruit : ignorer si déplacement < 3m ET dernier < 1s
          if (last) {
            const km = haversineKm({ lat: last.lat, lon: last.lon }, { lat: p.lat, lon: p.lon })
            const dt = (p.t - last.t) / 1000
            if (km < 0.003 && dt < 1) return prev
          }
          return [...prev, p]
        })
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setPermError('Autorise la géolocalisation pour mesurer ton trajet.')
        } else {
          setPermError(`Erreur GPS : ${err.message}`)
        }
        setTracking(false)
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    )
  }

  async function stop() {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
    }
    setTracking(false)
    if (!tripId || points.length < 2) {
      toast.error('Trace trop courte. Bouge un peu plus.')
      return
    }
    setEnding(true)
    try {
      const r = await fetch('/api/vida/trip/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip_id: tripId, points }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Erreur fin trajet')
      const flagged = data.status === 'flagged'
      if (flagged) {
        toast.warning('Trajet signalé', { description: 'Anti-fraude a détecté des incohérences.' })
      } else if (Number(data.gain_credits_eur) > 0) {
        toast.success(`+ ${Number(data.gain_credits_eur).toFixed(2)} € de Vida Credits 🎉`)
      } else {
        toast.success('Trajet enregistré')
      }
      router.push(`/dashboard/trajet/${tripId}`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
      setEnding(false)
    }
  }

  useEffect(() => {
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [])

  // KPI live
  let totalKm = 0
  for (let i = 1; i < points.length; i++) {
    totalKm += haversineKm(
      { lat: points[i - 1].lat, lon: points[i - 1].lon },
      { lat: points[i].lat, lon: points[i].lon },
    )
  }
  const elapsedMin = elapsed / 60000
  const speedKmh = elapsedMin > 0 ? totalKm / (elapsedMin / 60) : 0
  const lastAcc = points[points.length - 1]?.accuracy ?? null

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-3xl mx-auto flex items-center gap-3">
          <Link
            href="/dashboard/trajet"
            aria-label="Retour"
            className="text-white/60 hover:text-white transition flex items-center gap-1.5"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Retour</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Trajet en cours
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-5">
          <section className="glass rounded-2xl p-6 space-y-4 text-center">
            <div className="text-5xl">{MOBILITY_EMOJI[declaredMode]}</div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40">Mode déclaré</p>
              <p className="font-semibold text-lg">{MOBILITY_LABELS[declaredMode]}</p>
            </div>

            {permError && (
              <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                {permError}
              </p>
            )}

            {!tracking && points.length === 0 && !ending && (
              <button
                type="button"
                onClick={start}
                className="btn-primary w-full justify-center"
              >
                <MapPin size={18} /> Démarrer le tracking GPS
              </button>
            )}

            {tracking && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <KpiTile
                    label="Distance"
                    value={`${totalKm.toFixed(2)} km`}
                    sub={targetDistance > 0 ? `sur ${targetDistance.toFixed(1)} km` : undefined}
                  />
                  <KpiTile label="Durée" value={formatElapsed(elapsed)} />
                  <KpiTile label="Vitesse" value={`${speedKmh.toFixed(1)} km/h`} />
                </div>

                <div className="flex items-center justify-between text-xs text-white/45 px-1">
                  <span className="flex items-center gap-1.5">
                    <Activity size={12} className="text-emerald-400" />
                    {points.length} points captés
                  </span>
                  {lastAcc !== null && <span>± {Math.round(lastAcc)} m</span>}
                </div>

                <button
                  type="button"
                  onClick={stop}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-black font-semibold text-sm hover:scale-[1.01] active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <StopCircle size={18} /> Terminer le trajet
                </button>
              </div>
            )}

            {ending && (
              <div className="flex items-center justify-center gap-2 text-white/60">
                <Loader2 className="animate-spin" size={18} />
                Analyse anti-fraude en cours…
              </div>
            )}
          </section>

          <p className="text-[11px] text-white/35 px-2 leading-relaxed text-center">
            La trace GPS reste sur ton appareil pendant le trajet, et n&apos;est envoyée qu&apos;à la fin pour
            analyse anti-fraude. Aucun point n&apos;est partagé avec des tiers.
          </p>
        </div>
      </main>
    </>
  )
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function KpiTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/3 border border-white/5 rounded-xl p-3">
      <p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p>
      <p className="text-base font-semibold text-white/90 mt-1" style={{ fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-white/35 mt-0.5">{sub}</p>}
    </div>
  )
}
