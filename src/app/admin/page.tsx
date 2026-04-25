import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Activity, Users, Wallet, Trophy, ShieldAlert, MapPin, Megaphone } from 'lucide-react'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/utils'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!isSuperAdmin(user.email ?? null)) redirect('/dashboard')

  // Bypass RLS via service client pour stats globales
  const svc = createServiceClient()

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: usersTotal },
    { count: usersOnboarded },
    { count: tripsTotal },
    { count: tripsCompleted30d },
    { count: tripsFlagged30d },
    { data: walletAgg },
    { data: pools },
    { count: ambassadorsTotal },
    { count: contestsCompleted },
    { count: safetyActive },
    { count: challengesActive },
    { data: lastContests },
  ] = await Promise.all([
    svc.from('profiles').select('id', { count: 'exact', head: true }),
    svc.from('profiles').select('id', { count: 'exact', head: true }).eq('onboarding_completed', true),
    svc.from('trips').select('id', { count: 'exact', head: true }),
    svc.from('trips').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('ended_at', since30d),
    svc.from('trips').select('id', { count: 'exact', head: true }).eq('status', 'flagged').gte('ended_at', since30d),
    svc.from('wallets').select('balance, total_earned'),
    svc.from('pool_balances').select('pool_type, balance_eur, total_in_eur, total_out_eur'),
    svc.from('ambassadeur_profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    svc.from('contests_results').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    svc.from('safety_reports').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    svc.from('challenges_stake').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    svc.from('contests_results').select('id, type, period_start, period_end, total_distributed_eur, winners, created_at').order('period_end', { ascending: false }).limit(5),
  ])

  const totalBalance = (walletAgg ?? []).reduce((s, w) => s + Number(w.balance ?? 0), 0)
  const totalEarned = (walletAgg ?? []).reduce((s, w) => s + Number(w.total_earned ?? 0), 0)

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-white/60 hover:text-white transition text-sm">← Dashboard</Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Espace Pilote · Admin
          </h1>
          <span className="ml-auto text-[10px] text-amber-300 px-2 py-0.5 rounded bg-amber-500/15 uppercase tracking-wider">Super-admin</span>
        </header>

        <div className="px-6 pb-16 max-w-5xl mx-auto space-y-6">
          {/* KPI globaux */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Kpi icon={<Users size={18} />} label="Users total" value={(usersTotal ?? 0).toLocaleString('fr-FR')} hint={`${usersOnboarded ?? 0} onboardés`} color="emerald" />
            <Kpi icon={<MapPin size={18} />} label="Trips 30j" value={(tripsCompleted30d ?? 0).toLocaleString('fr-FR')} hint={`${tripsFlagged30d ?? 0} flagged · ${tripsTotal ?? 0} cumul`} color="cyan" />
            <Kpi icon={<Wallet size={18} />} label="Wallets cumul" value={formatPrice(totalBalance)} hint={`${formatPrice(totalEarned)} earned total`} color="violet" />
            <Kpi icon={<Megaphone size={18} />} label="Ambassadeurs" value={(ambassadorsTotal ?? 0).toLocaleString('fr-FR')} hint="Actifs" color="amber" />
          </section>

          {/* Pools */}
          <section className="glass rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <Activity size={18} className="text-emerald-300" /> Pools de redistribution
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(pools ?? []).map((p) => (
                <div key={p.pool_type} className="rounded-xl bg-white/[0.04] border border-white/5 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/45">{p.pool_type}</p>
                  <p className="text-lg font-bold mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                    {formatPrice(Number(p.balance_eur))}
                  </p>
                  <p className="text-[10px] text-white/45">in {formatPrice(Number(p.total_in_eur))} · out {formatPrice(Number(p.total_out_eur))}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Stats secondaires */}
          <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Kpi icon={<Trophy size={18} />} label="Contests" value={(contestsCompleted ?? 0).toString()} hint="Distribués" color="amber" />
            <Kpi icon={<ShieldAlert size={18} />} label="Safety actifs" value={(safetyActive ?? 0).toString()} hint="Reports communautaires" color="amber" />
            <Kpi icon={<Activity size={18} />} label="Challenges actifs" value={(challengesActive ?? 0).toString()} hint="Stake en cours" color="violet" />
          </section>

          {/* Last contests */}
          <section className="glass rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>5 derniers concours</h2>
            {!lastContests || lastContests.length === 0 ? (
              <p className="text-sm text-white/55">Aucun concours encore distribué.</p>
            ) : (
              <ul className="divide-y divide-white/5 text-sm">
                {lastContests.map((c) => (
                  <li key={c.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{c.type}</p>
                      <p className="text-xs text-white/45">{new Date(c.period_start).toLocaleDateString('fr-FR')} → {new Date(c.period_end).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold tabular-nums">{formatPrice(Number(c.total_distributed_eur))}</p>
                      <p className="text-xs text-white/45">{(c.winners as unknown[]).length} winners</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Liens admin */}
          <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Link href="/admin/users" className="glass rounded-xl p-4 hover:border-emerald-400/30 transition">
              <p className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Users</p>
              <p className="text-xs text-white/55">Recherche, modération, super-admin grant</p>
            </Link>
            <Link href="/admin/contests" className="glass rounded-xl p-4 hover:border-emerald-400/30 transition">
              <p className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Concours</p>
              <p className="text-xs text-white/55">Trigger manuel + audit</p>
            </Link>
            <Link href="/admin/pools" className="glass rounded-xl p-4 hover:border-emerald-400/30 transition">
              <p className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Pools</p>
              <p className="text-xs text-white/55">Crédit / Débit manuel + ledger</p>
            </Link>
          </section>
        </div>
      </main>
    </>
  )
}

function Kpi({ icon, label, value, hint, color }: { icon: React.ReactNode; label: string; value: string; hint: string; color: string }) {
  const colorClass = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
    violet: 'text-violet-400 bg-violet-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
  }[color] ?? 'text-white/55 bg-white/5'

  return (
    <div className="glass rounded-2xl p-4 space-y-1.5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorClass}`}>{icon}</div>
      <p className="text-[10px] uppercase tracking-wider text-white/45">{label}</p>
      <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
      <p className="text-[11px] text-white/45">{hint}</p>
    </div>
  )
}
