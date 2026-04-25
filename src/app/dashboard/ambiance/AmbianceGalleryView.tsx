'use client'

import Link from 'next/link'
import { ArrowLeft, Headphones, Sparkles } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { recommendMode, timeOfDayNow, type AmbientMode } from '@/lib/ambient'

const TIME_LABEL: Record<string, string> = {
  morning: 'matin',
  midday: 'midi',
  afternoon: 'après-midi',
  evening: 'soir',
  night: 'nuit',
  any: 'tout moment',
}

export function AmbianceGalleryView({
  modes,
  prefs,
}: {
  modes: AmbientMode[]
  prefs: {
    last_mode_slug: string | null
    default_volume: number
    binaural_enabled: boolean
    total_minutes_listened: number
  } | null
}) {
  const tod = timeOfDayNow()
  const recommended = recommendMode(modes, { tod }) ?? modes[0] ?? null

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-white/60 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft size={18} />
            <span className="text-sm">Dashboard</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Modes Ambiance
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-5xl mx-auto space-y-6">
          {/* Hero */}
          <section className="glass rounded-3xl p-6 bg-gradient-to-br from-violet-500/10 to-emerald-500/10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/15 text-violet-300 flex items-center justify-center">
                <Headphones size={22} />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-white/45">Trois.js + Audio binaural</p>
                <h2 className="text-xl font-bold mt-0.5 gradient-text-aurora" style={{ fontFamily: 'var(--font-display)' }}>
                  6 mondes pour habiter ton trajet
                </h2>
                <p className="text-sm text-white/55 mt-1">
                  Fréquences Solfège + battements binauraux. À écouter au casque pour l'effet complet.
                </p>
                {prefs && prefs.total_minutes_listened > 0 && (
                  <p className="text-xs text-white/45 mt-2">
                    Tu as déjà écouté {prefs.total_minutes_listened} minute{prefs.total_minutes_listened > 1 ? 's' : ''}.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Recommandé */}
          {recommended && (
            <section className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-white/40 ml-1">Recommandé pour ce {TIME_LABEL[tod] ?? 'moment'}</p>
              <Link
                href={`/dashboard/ambiance/${recommended.slug}`}
                className="glass rounded-3xl p-6 flex items-center gap-4 hover:border-violet-400/30 transition group"
                style={{
                  background: `linear-gradient(135deg, ${recommended.primary_color}22, ${recommended.secondary_color}33)`,
                  borderColor: `${recommended.primary_color}33`,
                }}
              >
                <div className="text-4xl">{recommended.emoji}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                    {recommended.name}
                  </h3>
                  <p className="text-sm text-white/65 italic mt-0.5">"{recommended.tagline}"</p>
                </div>
                <Sparkles size={20} className="text-violet-300 group-hover:scale-110 transition" />
              </Link>
            </section>
          )}

          {/* Galerie 6 modes */}
          <section className="grid sm:grid-cols-2 gap-4">
            {modes.map((m) => (
              <Link
                key={m.slug}
                href={`/dashboard/ambiance/${m.slug}`}
                className="glass rounded-2xl p-5 flex flex-col gap-3 hover:border-white/30 transition group relative overflow-hidden"
              >
                <div
                  className="absolute inset-0 opacity-30 group-hover:opacity-50 transition"
                  style={{
                    background: `radial-gradient(circle at 30% 20%, ${m.primary_color}55 0%, transparent 60%), radial-gradient(circle at 70% 80%, ${m.secondary_color}33 0%, transparent 60%)`,
                  }}
                />
                <div className="relative flex items-start gap-3">
                  <div className="text-3xl">{m.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                      {m.name}
                    </h3>
                    <p className="text-xs text-white/55 mt-0.5 italic line-clamp-1">"{m.tagline}"</p>
                  </div>
                </div>
                <p className="relative text-sm text-white/65 leading-snug line-clamp-3">{m.description}</p>
                <div className="relative flex items-center justify-between text-xs text-white/45">
                  <span>{m.carrier_hz} Hz · {m.beat_band} {m.beat_hz} Hz</span>
                  <span className="text-violet-300/80">→</span>
                </div>
              </Link>
            ))}
          </section>

          <p className="text-xs text-white/40 text-center">
            Les ambiances tournent à 60fps avec Three.js. Sur mobile, on cap pixelRatio 1.5 pour préserver la batterie.
          </p>
        </div>
      </main>
    </>
  )
}
