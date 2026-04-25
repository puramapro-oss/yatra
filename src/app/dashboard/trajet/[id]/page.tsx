import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Leaf, Sparkles, Clock, Route, AlertTriangle, ShieldCheck, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { MOBILITY_LABELS, MOBILITY_EMOJI } from '@/types/vida'
import { formatPrice, formatDate } from '@/lib/utils'
import type { MobilityMode } from '@/types/vida'

export const dynamic = 'force-dynamic'

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trip } = await supabase
    .from('trips')
    .select('id, status, declared_mode, detected_mode, distance_km, duration_min, gain_credits_eur, co2_avoided_kg, fraud_score, fraud_reasons, from_label, to_label, started_at, ended_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!trip) notFound()

  const { data: track } = await supabase
    .from('gps_tracks')
    .select('count, avg_speed_kmh, max_speed_kmh')
    .eq('trip_id', id)
    .maybeSingle()

  const flagged = trip.status === 'flagged'
  const declaredMode = trip.declared_mode as MobilityMode

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-3xl mx-auto flex items-center gap-3">
          <Link
            href="/dashboard/trajets"
            aria-label="Retour"
            className="text-white/60 hover:text-white transition flex items-center gap-1.5"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Mes trajets</span>
          </Link>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-5">
          <section className="glass rounded-2xl p-6 space-y-4 text-center">
            <div className="text-6xl">{MOBILITY_EMOJI[declaredMode]}</div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40">Mode</p>
              <h1 className="text-2xl font-bold mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                {MOBILITY_LABELS[declaredMode]}
              </h1>
              <p className="text-xs text-white/40 mt-1">
                {trip.from_label && trip.to_label ? (
                  <>
                    De {short(trip.from_label)} → {short(trip.to_label)}
                  </>
                ) : (
                  <>Démarré {formatDate(trip.started_at)}</>
                )}
              </p>
            </div>

            {flagged ? (
              <FlaggedBanner reasons={trip.fraud_reasons ?? []} score={trip.fraud_score ?? 0} />
            ) : (
              <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-xl px-4 py-3 flex items-center gap-2 justify-center">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span className="text-sm text-emerald-300">
                  Trajet validé · Score anti-fraude {trip.fraud_score}/100
                </span>
              </div>
            )}
          </section>

          <section className="grid sm:grid-cols-2 gap-3">
            <Tile
              icon={<Route size={18} />}
              label="Distance"
              value={`${Number(trip.distance_km).toFixed(2)} km`}
              color="cyan"
            />
            <Tile
              icon={<Clock size={18} />}
              label="Durée"
              value={`${Math.round(Number(trip.duration_min))} min`}
              color="violet"
            />
            <Tile
              icon={<Sparkles size={18} />}
              label="Tu as gagné"
              value={Number(trip.gain_credits_eur) > 0 ? `+ ${formatPrice(Number(trip.gain_credits_eur))}` : '—'}
              color="emerald"
              highlight={Number(trip.gain_credits_eur) > 0}
            />
            <Tile
              icon={<Leaf size={18} />}
              label="CO₂ évité"
              value={`${Number(trip.co2_avoided_kg).toFixed(2)} kg`}
              color="emerald"
            />
          </section>

          {track && (
            <section className="glass rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <Activity size={16} className="text-emerald-400" /> Détails GPS
              </h2>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <Mini label="Points captés" value={String(track.count)} />
                <Mini label="Vitesse moy." value={`${Number(track.avg_speed_kmh).toFixed(1)} km/h`} />
                <Mini label="Vitesse max" value={`${Number(track.max_speed_kmh).toFixed(1)} km/h`} />
              </div>
              {trip.detected_mode && trip.detected_mode !== declaredMode && (
                <p className="text-[11px] text-amber-300/80">
                  ⚠ Mode détecté par l&apos;analyse&nbsp;: {MOBILITY_LABELS[trip.detected_mode as MobilityMode]}
                </p>
              )}
            </section>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/dashboard/trajet" className="btn-primary justify-center flex-1">
              Nouveau trajet
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-3 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-sm text-center transition flex-1"
            >
              Retour au tableau
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

function FlaggedBanner({ reasons, score }: { reasons: string[]; score: number }) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-left space-y-2">
      <div className="flex items-center gap-2 font-semibold text-amber-300">
        <AlertTriangle size={16} /> Trajet signalé · Score {score}/100
      </div>
      <p className="text-xs text-amber-200/80">
        L&apos;anti-fraude a détecté des incohérences. Aucun gain n&apos;a été crédité.
      </p>
      {reasons.length > 0 && (
        <ul className="text-[11px] text-amber-200/70 space-y-0.5 list-disc pl-4">
          {reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Tile({
  icon,
  label,
  value,
  color,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: 'emerald' | 'cyan' | 'violet'
  highlight?: boolean
}) {
  const cls = {
    emerald: 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300',
    cyan: 'bg-cyan-500/10 border-cyan-400/30 text-cyan-300',
    violet: 'bg-violet-500/10 border-violet-400/30 text-violet-300',
  }[color]
  return (
    <div className={`glass rounded-2xl p-4 ${highlight ? 'ring-1 ring-emerald-400/40' : ''}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cls}`}>{icon}</div>
      <p className="text-[11px] uppercase tracking-wider text-white/40 mt-3">{label}</p>
      <p className="text-xl font-bold mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p>
      <p className="font-semibold mt-0.5">{value}</p>
    </div>
  )
}

function short(s: string): string {
  return s.split(',').slice(0, 2).join(',')
}
