import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Compass, Sparkles, Leaf, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { MOBILITY_LABELS, MOBILITY_EMOJI, type MobilityMode } from '@/types/vida'
import { formatPrice, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function TripsListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trips } = await supabase
    .from('trips')
    .select('id, status, declared_mode, distance_km, gain_credits_eur, co2_avoided_kg, duration_min, fraud_score, started_at')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(100)

  const completed = (trips ?? []).filter((t) => t.status === 'completed')
  const totalKm = completed.reduce((s, t) => s + Number(t.distance_km ?? 0), 0)
  const totalGain = completed.reduce((s, t) => s + Number(t.gain_credits_eur ?? 0), 0)
  const totalCo2 = completed.reduce((s, t) => s + Number(t.co2_avoided_kg ?? 0), 0)

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
            Mes trajets
          </h1>
          <Link
            href="/dashboard/trajet"
            className="ml-auto px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-black text-xs font-semibold hover:scale-[1.02] transition"
          >
            + Nouveau
          </Link>
        </header>

        <div className="px-6 pb-16 max-w-4xl mx-auto space-y-5">
          {/* KPI globaux */}
          <section className="grid grid-cols-3 gap-3">
            <Tile icon={<Compass size={16} />} label="Trajets" value={String(completed.length)} color="cyan" />
            <Tile icon={<Sparkles size={16} />} label="Gagné" value={formatPrice(totalGain)} color="emerald" />
            <Tile icon={<Leaf size={16} />} label="CO₂ évité" value={`${totalCo2.toFixed(1)} kg`} color="violet" />
          </section>

          {/* Liste */}
          <section className="space-y-2">
            {(trips ?? []).length === 0 && (
              <div className="glass rounded-2xl p-8 text-center space-y-3">
                <div className="text-4xl">🛤️</div>
                <p className="text-white/60 text-sm">Aucun trajet pour l&apos;instant.</p>
                <Link href="/dashboard/trajet" className="btn-primary justify-center inline-flex">
                  Démarrer mon premier trajet
                </Link>
              </div>
            )}

            {(trips ?? []).map((t) => {
              const declared = t.declared_mode as MobilityMode
              const flagged = t.status === 'flagged'
              const discarded = t.status === 'discarded'
              return (
                <Link
                  key={t.id}
                  href={`/dashboard/trajet/${t.id}`}
                  className={`glass rounded-2xl p-4 flex items-center gap-3 hover:border-emerald-400/30 transition ${
                    flagged ? 'border-amber-400/30' : discarded ? 'opacity-50' : ''
                  }`}
                >
                  <span className="text-3xl">{MOBILITY_EMOJI[declared]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{MOBILITY_LABELS[declared]}</span>
                      {flagged && (
                        <span className="text-[9px] uppercase tracking-wider text-amber-300 bg-amber-400/15 px-1.5 py-0.5 rounded border border-amber-400/30">
                          Signalé
                        </span>
                      )}
                      {discarded && (
                        <span className="text-[9px] uppercase tracking-wider text-white/40 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                          Annulé
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/40 mt-0.5 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {Math.round(Number(t.duration_min ?? 0))} min
                      </span>
                      <span>·</span>
                      <span>{Number(t.distance_km ?? 0).toFixed(2)} km</span>
                      <span>·</span>
                      <span>{formatDate(t.started_at)}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-base font-semibold ${
                        Number(t.gain_credits_eur ?? 0) > 0 ? 'text-emerald-300' : 'text-white/40'
                      }`}
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {Number(t.gain_credits_eur ?? 0) > 0
                        ? `+${formatPrice(Number(t.gain_credits_eur))}`
                        : '—'}
                    </p>
                    <p className="text-[10px] text-white/35">
                      {Number(t.co2_avoided_kg ?? 0).toFixed(1)} kg CO₂
                    </p>
                  </div>
                </Link>
              )
            })}
          </section>
        </div>
      </main>
    </>
  )
}

function Tile({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: 'emerald' | 'cyan' | 'violet'
}) {
  const cls = {
    emerald: 'bg-emerald-500/10 text-emerald-300',
    cyan: 'bg-cyan-500/10 text-cyan-300',
    violet: 'bg-violet-500/10 text-violet-300',
  }[color]
  return (
    <div className="glass rounded-2xl p-4">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cls}`}>{icon}</div>
      <p className="text-[10px] uppercase tracking-wider text-white/40 mt-2">{label}</p>
      <p className="text-xl font-bold mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
    </div>
  )
}
