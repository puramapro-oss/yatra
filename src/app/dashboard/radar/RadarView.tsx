'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, List, Loader2, MapPin, Navigation } from 'lucide-react'
import { toast } from 'sonner'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { angleDiff } from '@/lib/geo'

type Pin = {
  kind: 'event' | 'partner'
  id: string
  slug: string
  title: string
  category: string | null
  city: string | null
  lat: number
  lon: number
  distance_km: number
  bearing_deg: number
  cardinal: string
}

type Tab = 'list' | 'camera'

const KIND_EMOJI: Record<string, string> = {
  event: '🌳',
  partner: '🚲',
}

export function RadarView() {
  const [tab, setTab] = useState<Tab>('list')
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null)
  const [heading, setHeading] = useState<number | null>(null)
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Geolocation
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoError('Géolocalisation non disponible sur ce navigateur.')
      return
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords(pos.coords)
        setGeoError(null)
      },
      (err) => setGeoError(err.message || 'Erreur géolocalisation'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [])

  // Compass heading via DeviceOrientationEvent (gracefully degrades)
  useEffect(() => {
    function onOrient(e: DeviceOrientationEvent) {
      // webkit Safari : event.webkitCompassHeading is true heading
      const wk = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading
      if (typeof wk === 'number') {
        setHeading(wk)
      } else if (e.alpha != null) {
        setHeading((360 - e.alpha) % 360)
      }
    }
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return
    window.addEventListener('deviceorientation', onOrient)
    return () => window.removeEventListener('deviceorientation', onOrient)
  }, [])

  // Fetch pins quand coords disponibles
  useEffect(() => {
    if (!coords) return
    const ctrl = new AbortController()
    setLoading(true)
    fetch(`/api/radar/nearest?lat=${coords.latitude}&lon=${coords.longitude}&radius_km=20`, {
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.pins) setPins(data.pins)
        else if (data?.error) toast.error(data.error)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [coords?.latitude, coords?.longitude])

  // Camera stream — démarre au switch tab=camera
  useEffect(() => {
    if (tab !== 'camera') {
      // stop stream si on quitte la vue camera
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setCameraReady(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setCameraReady(true)

        // iOS demande la permission compass via gesture
        try {
          const Anyone = (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
          if (typeof Anyone.requestPermission === 'function') {
            await Anyone.requestPermission()
          }
        } catch {
          // ignore
        }
      } catch (err) {
        toast.error('Impossible d\'accéder à la caméra. Vérifie les permissions du navigateur.')
        setTab('list')
      }
    })()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [tab])

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-white/60 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft size={18} />
            <span className="text-sm">Dashboard</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Radar
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-4xl mx-auto space-y-5">
          {/* Header info */}
          <section className="glass rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-300 flex items-center justify-center">
                <MapPin size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {coords
                    ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
                    : geoError
                    ? 'Géolocalisation refusée'
                    : 'Localisation en cours…'}
                </p>
                <p className="text-xs text-white/45">
                  {pins.length > 0 && `${pins.length} points dans 20 km`}
                  {heading != null && ` · cap ${Math.round(heading)}°`}
                </p>
              </div>
            </div>

            <div className="inline-flex rounded-full border border-white/10 p-1 bg-white/[0.02]">
              <button
                onClick={() => setTab('list')}
                className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1 transition ${
                  tab === 'list' ? 'bg-emerald-500/20 text-emerald-200' : 'text-white/55'
                }`}
              >
                <List size={12} /> Liste
              </button>
              <button
                onClick={() => setTab('camera')}
                className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1 transition ${
                  tab === 'camera' ? 'bg-emerald-500/20 text-emerald-200' : 'text-white/55'
                }`}
              >
                <Camera size={12} /> Caméra
              </button>
            </div>
          </section>

          {geoError && (
            <p className="text-sm text-amber-300 text-center">
              {geoError} · Active la géolocalisation pour voir le radar.
            </p>
          )}

          {tab === 'list' && (
            <section className="space-y-3">
              {loading && pins.length === 0 && (
                <div className="text-center text-white/55 py-12">
                  <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                  Recherche des points proches…
                </div>
              )}
              {!loading && pins.length === 0 && coords && (
                <div className="text-center text-white/55 py-12">
                  Aucun point dans un rayon de 20 km.
                </div>
              )}
              {pins.map((pin) => (
                <Link
                  key={`${pin.kind}-${pin.id}`}
                  href={pin.kind === 'event' ? `/dashboard/gratuit` : `/dashboard/cashback`}
                  className="glass rounded-2xl p-4 flex items-center gap-4 hover:border-emerald-400/30 transition"
                >
                  <div className="text-2xl">{KIND_EMOJI[pin.kind]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{pin.title}</p>
                    <p className="text-xs text-white/45 truncate">
                      {pin.category && <>{pin.category} · </>}
                      {pin.city && <>{pin.city} · </>}
                      {pin.distance_km < 1
                        ? `${Math.round(pin.distance_km * 1000)} m`
                        : `${pin.distance_km.toFixed(1)} km`}
                      {' '}vers {pin.cardinal}
                    </p>
                  </div>
                  <Navigation
                    size={20}
                    className="text-emerald-300 shrink-0"
                    style={{
                      transform:
                        heading != null
                          ? `rotate(${angleDiff(pin.bearing_deg, heading)}deg)`
                          : `rotate(${pin.bearing_deg}deg)`,
                      transition: 'transform 0.3s',
                    }}
                  />
                </Link>
              ))}
            </section>
          )}

          {tab === 'camera' && (
            <section className="relative aspect-[9/16] sm:aspect-video rounded-3xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  <p className="text-sm">Activation caméra…</p>
                </div>
              )}

              {/* Overlay pins */}
              {cameraReady && coords && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs text-white/80 backdrop-blur-md bg-black/40 px-3 py-2 rounded-full">
                    <span>📍 Cap {heading != null ? `${Math.round(heading)}°` : '—'}</span>
                    <span>{pins.length} points autour</span>
                  </div>

                  {pins.slice(0, 5).map((pin) => {
                    const delta = heading != null ? angleDiff(pin.bearing_deg, heading) : 0
                    const inFov = Math.abs(delta) < 60 // FOV simulé ±60°
                    if (!inFov && heading != null) return null
                    const xPercent = heading != null ? 50 + (delta / 60) * 50 : 50
                    return (
                      <div
                        key={`${pin.kind}-${pin.id}`}
                        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                        style={{
                          left: `${Math.max(5, Math.min(95, xPercent))}%`,
                          top: `${50 - Math.min(20, pin.distance_km / 20 * 20)}%`,
                          transition: 'left 0.3s, top 0.3s',
                        }}
                      >
                        <div className="backdrop-blur-md bg-black/50 border border-white/20 rounded-2xl px-3 py-2 text-xs whitespace-nowrap shadow-lg">
                          <p className="font-semibold">
                            {KIND_EMOJI[pin.kind]} {pin.title}
                          </p>
                          <p className="text-white/65">
                            {pin.distance_km < 1
                              ? `${Math.round(pin.distance_km * 1000)} m`
                              : `${pin.distance_km.toFixed(1)} km`}
                            {' · '}{pin.cardinal}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          <p className="text-xs text-white/40 text-center">
            La caméra et la boussole nécessitent ton accord. Aucune image n'est envoyée — tout est traité localement.
          </p>
        </div>
      </main>
    </>
  )
}
