'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { BinauralEngine } from '@/lib/binaural'

const AmbientCanvas = dynamic(() => import('@/components/ambient/AmbientCanvas').then((m) => m.AmbientCanvas), {
  ssr: false,
})

type Mode = {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  carrier_hz: number
  beat_hz: number
  beat_band: string
  primary_color: string
  secondary_color: string
  emoji: string
}

export function ImmersionView({
  mode,
  defaultVolume,
  defaultBinauralEnabled,
}: {
  mode: Mode
  defaultVolume: number
  defaultBinauralEnabled: boolean
}) {
  const router = useRouter()
  const engineRef = useRef<BinauralEngine | null>(null)
  const sessionStartRef = useRef<number | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const binauralPlayedRef = useRef(false)

  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(defaultVolume)
  const [binauralOn, setBinauralOn] = useState(defaultBinauralEnabled)
  const [elapsed, setElapsed] = useState(0)
  const [bootstrapped, setBootstrapped] = useState(false)

  // Ouvre la session côté serveur (telemetry)
  useEffect(() => {
    let cancelled = false
    fetch('/api/ambient/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode_slug: mode.slug }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data?.session?.id) {
          sessionIdRef.current = data.session.id
          sessionStartRef.current = Date.now()
        }
      })
      .catch(() => {})

    fetch('/api/ambient/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ last_mode_slug: mode.slug }),
    }).catch(() => {})

    setBootstrapped(true)
    return () => {
      cancelled = true
    }
  }, [mode.slug])

  // Compteur temps écoulé
  useEffect(() => {
    if (!sessionStartRef.current) return
    const id = setInterval(() => {
      const start = sessionStartRef.current
      if (start) setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [bootstrapped])

  // Cleanup à la sortie
  useEffect(() => {
    return () => {
      const engine = engineRef.current
      if (engine) {
        engine.dispose().catch(() => {})
      }
      const sessionId = sessionIdRef.current
      const start = sessionStartRef.current
      if (sessionId && start) {
        const duration = Math.floor((Date.now() - start) / 1000)
        navigator.sendBeacon?.(
          '/api/ambient/session',
          new Blob(
            [
              JSON.stringify({
                session_id: sessionId,
                duration_seconds: duration,
                binaural_played: binauralPlayedRef.current,
              }),
            ],
            { type: 'application/json' },
          ),
        ) ||
          fetch('/api/ambient/session', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessionId,
              duration_seconds: duration,
              binaural_played: binauralPlayedRef.current,
            }),
            keepalive: true,
          }).catch(() => {})
      }
    }
  }, [])

  async function handleTogglePlay() {
    if (playing) {
      const engine = engineRef.current
      if (engine) await engine.stop()
      setPlaying(false)
    } else {
      if (!engineRef.current) engineRef.current = new BinauralEngine()
      try {
        await engineRef.current.play({
          carrierHz: mode.carrier_hz,
          beatHz: mode.beat_hz,
          volume: binauralOn ? volume : 0,
        })
        binauralPlayedRef.current = true
        setPlaying(true)
      } catch {
        // si AudioContext bloqué, on accepte silencieusement
      }
    }
  }

  function handleVolumeChange(v: number) {
    setVolume(v)
    engineRef.current?.setVolume(binauralOn ? v : 0)
  }

  function toggleBinaural() {
    const next = !binauralOn
    setBinauralOn(next)
    engineRef.current?.setVolume(next ? volume : 0)
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-black">
      {/* Canvas plein écran derrière */}
      <div className="absolute inset-0">
        <AmbientCanvas slug={mode.slug} />
      </div>

      {/* Voile de couleur sur fond */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${mode.primary_color}11 0%, transparent 60%), linear-gradient(180deg, transparent 0%, ${mode.secondary_color}55 100%)`,
        }}
      />

      {/* UI overlay */}
      <div className="relative z-10 flex flex-col min-h-dvh">
        <header className="px-6 py-5 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard/ambiance')}
            className="text-white/70 hover:text-white transition flex items-center gap-1.5 backdrop-blur-md bg-black/30 px-3 py-1.5 rounded-full"
          >
            <ArrowLeft size={16} /> Retour
          </button>
          <div className="text-right backdrop-blur-md bg-black/30 px-3 py-1.5 rounded-full text-xs text-white/70">
            {formatDuration(elapsed)}
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-end px-6 pb-12">
          <div className="text-center mb-10 max-w-md">
            <div className="text-6xl mb-4">{mode.emoji}</div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              {mode.name}
            </h1>
            <p className="text-white/70 italic mt-2">"{mode.tagline}"</p>
            <p className="text-xs text-white/50 mt-4">
              {mode.carrier_hz} Hz · battement {mode.beat_band} {mode.beat_hz} Hz
            </p>
          </div>

          {/* Controls */}
          <div className="w-full max-w-md backdrop-blur-xl bg-black/40 border border-white/10 rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleTogglePlay}
                className="w-14 h-14 rounded-full bg-white text-black hover:scale-105 transition flex items-center justify-center shrink-0"
                aria-label={playing ? 'Pause' : 'Lecture'}
              >
                {playing ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{playing ? 'En cours' : 'Appuie pour démarrer'}</p>
                <p className="text-xs text-white/50">
                  Casque audio recommandé pour l'effet binaural
                </p>
              </div>
              <button
                onClick={toggleBinaural}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                  binauralOn ? 'bg-violet-500/20 text-violet-200' : 'bg-white/5 text-white/40'
                }`}
                aria-label={binauralOn ? 'Désactiver son' : 'Activer son'}
                title={binauralOn ? 'Son binaural ON' : 'Son binaural OFF'}
              >
                {binauralOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-white/40 mb-1.5">Volume</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-full accent-violet-400"
              />
            </div>

            <p className="text-xs text-white/45 text-center pt-1">
              {mode.description}
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
