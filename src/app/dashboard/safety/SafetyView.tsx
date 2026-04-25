'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Loader2, MapPin, Send, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import {
  SAFETY_CATEGORIES,
  SAFETY_CATEGORY_EMOJI,
  SAFETY_CATEGORY_LABELS,
  SAFETY_SEVERITIES,
  SAFETY_SEVERITY_LABELS,
  type SafetyCategory,
  type SafetyCluster,
  type SafetySeverity,
} from '@/lib/safety'

type MyReport = {
  id: string
  category: string
  severity: string
  lat: number
  lon: number
  description: string
  status: string
  created_at: string
  expires_at: string
}

export function SafetyView({
  myReports,
  trustScore,
  trustLabel,
}: {
  myReports: MyReport[]
  trustScore: number
  trustLabel: string
}) {
  const router = useRouter()
  const [pos, setPos] = useState<{ lat: number; lon: number } | null>(null)
  const [permission, setPermission] = useState<'idle' | 'asking' | 'granted' | 'denied'>('idle')
  const [zones, setZones] = useState<{ count: number; clusters: SafetyCluster[] } | null>(null)
  const [loadingZones, setLoadingZones] = useState(false)
  const [category, setCategory] = useState<SafetyCategory>('voirie_degradee')
  const [severity, setSeverity] = useState<SafetySeverity>('warning')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setPermission('denied')
      return
    }
    setPermission('asking')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPermission('granted')
        setPos({ lat: p.coords.latitude, lon: p.coords.longitude })
      },
      () => setPermission('denied'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  useEffect(() => {
    if (!pos) return
    let alive = true
    setLoadingZones(true)
    fetch(`/api/safety/zones?lat=${pos.lat}&lon=${pos.lon}&radius_km=5`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return
        setZones({ count: d?.count ?? 0, clusters: d?.clusters ?? [] })
      })
      .catch(() => {
        if (alive) toast.error('Impossible de charger les zones')
      })
      .finally(() => alive && setLoadingZones(false))
    return () => { alive = false }
  }, [pos])

  const trustOk = trustScore >= 20

  async function submitReport() {
    if (!pos) {
      toast.error('Position requise')
      return
    }
    if (description.trim().length < 10) {
      toast.error('Description : 10 caractères min')
      return
    }
    setSubmitting(true)
    try {
      const r = await fetch('/api/safety/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          severity,
          lat: pos.lat,
          lon: pos.lon,
          description: description.trim(),
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Erreur')
      toast.success('Signalement enregistré 🙏')
      setDescription('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-white/60 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft size={18} />
            <span className="text-sm">Dashboard</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Sécurité Vivante
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-6">
          {/* Hero */}
          <section className="glass rounded-3xl p-6 bg-gradient-to-br from-amber-500/10 to-violet-500/10 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-300 flex items-center justify-center">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold gradient-text-aurora" style={{ fontFamily: 'var(--font-display)' }}>
                  Carte communautaire
                </h2>
                <p className="text-sm text-white/65 mt-1">
                  Tu signales ce que tu vois. La communauté évite les zones flaguées. Trust Score : {trustScore}/100 ({trustLabel}).
                </p>
              </div>
            </div>
          </section>

          {/* Position */}
          {permission === 'asking' && (
            <p className="text-sm text-white/55 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Localisation en cours…
            </p>
          )}
          {permission === 'denied' && (
            <p className="text-sm text-amber-300 bg-amber-500/10 border border-amber-400/20 rounded-xl p-3">
              Pour signaler / voir les zones autour, autorise la localisation.
            </p>
          )}

          {/* Zones autour de moi */}
          {pos && (
            <section className="glass rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <MapPin size={18} className="text-emerald-300" />
                Zones autour (5 km)
              </h3>
              {loadingZones ? (
                <p className="text-sm text-white/55 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Chargement…
                </p>
              ) : zones && zones.count > 0 ? (
                <ul className="space-y-2">
                  {zones.clusters.map((c) => (
                    <li
                      key={c.id}
                      className={`rounded-xl p-3 border flex items-center justify-between gap-2 ${
                        c.severity === 'danger'
                          ? 'bg-red-500/10 border-red-400/30 text-red-100'
                          : c.severity === 'warning'
                            ? 'bg-amber-500/10 border-amber-400/30 text-amber-100'
                            : 'bg-cyan-500/10 border-cyan-400/30 text-cyan-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{SAFETY_CATEGORY_EMOJI[c.categories[0] ?? 'autre']}</span>
                        <div className="text-sm min-w-0">
                          <p className="font-medium truncate">
                            {SAFETY_SEVERITY_LABELS[c.severity]} · {c.count} signalement{c.count > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs opacity-80 truncate">
                            {c.lat.toFixed(4)}, {c.lon.toFixed(4)}
                          </p>
                        </div>
                      </div>
                      {c.count > 1 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 font-semibold">×{c.count}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-white/55">Aucun signalement actif dans la zone. Tout va bien autour 🌿</p>
              )}
            </section>
          )}

          {/* Form signalement */}
          {pos && trustOk && (
            <section className="glass rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <AlertTriangle size={18} className="text-amber-300" />
                Signaler ici
              </h3>
              <p className="text-xs text-white/45">
                Position détectée : {pos.lat.toFixed(4)}, {pos.lon.toFixed(4)}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SAFETY_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`rounded-xl p-3 text-left text-sm flex items-center gap-2 border transition ${
                      category === cat
                        ? 'border-amber-400/50 bg-amber-500/10'
                        : 'border-white/5 bg-white/[0.03] hover:border-white/15'
                    }`}
                  >
                    <span className="text-lg">{SAFETY_CATEGORY_EMOJI[cat]}</span>
                    <span className="truncate">{SAFETY_CATEGORY_LABELS[cat]}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {SAFETY_SEVERITIES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={`rounded-xl p-2 text-sm border transition ${
                      severity === s
                        ? s === 'danger'
                          ? 'border-red-400/50 bg-red-500/15 text-red-100'
                          : s === 'warning'
                            ? 'border-amber-400/50 bg-amber-500/15 text-amber-100'
                            : 'border-cyan-400/50 bg-cyan-500/15 text-cyan-100'
                        : 'border-white/5 bg-white/[0.03] text-white/65'
                    }`}
                  >
                    {SAFETY_SEVERITY_LABELS[s]}
                  </button>
                ))}
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Décris ce que tu observes (10-500 chars)…"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-sm focus:border-amber-400/40 focus:outline-none"
              />
              <button
                onClick={submitReport}
                disabled={submitting || description.trim().length < 10}
                className="btn-primary w-full justify-center disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Envoyer le signalement
              </button>
            </section>
          )}

          {pos && !trustOk && (
            <p className="text-sm text-amber-300 bg-amber-500/10 border border-amber-400/20 rounded-xl p-3">
              Trust Score actuel {trustScore}/100 — il te faut au moins 20 pour signaler. Continue à valider des trajets propres.
            </p>
          )}

          {/* Mes signalements */}
          {myReports.length > 0 && (
            <section className="glass rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Mes signalements</h3>
              <ul className="divide-y divide-white/5">
                {myReports.map((r) => (
                  <li key={r.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-sm">
                        {SAFETY_CATEGORY_EMOJI[r.category as SafetyCategory] ?? '📍'}{' '}
                        {SAFETY_CATEGORY_LABELS[r.category as SafetyCategory] ?? r.category}
                      </p>
                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider ${
                        r.severity === 'danger' ? 'bg-red-500/20 text-red-200' :
                        r.severity === 'warning' ? 'bg-amber-500/20 text-amber-200' :
                        'bg-cyan-500/20 text-cyan-200'
                      }`}>{r.severity}</span>
                    </div>
                    <p className="text-xs text-white/55 mt-0.5">{r.description}</p>
                    <p className="text-[10px] text-white/35 mt-0.5">
                      {new Date(r.created_at).toLocaleDateString('fr-FR')} · expire {new Date(r.expires_at).toLocaleDateString('fr-FR')}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </>
  )
}
