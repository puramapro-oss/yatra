'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, LogOut, Compass, Wallet, Trophy, MapPin, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { getGreeting, formatPrice } from '@/lib/utils'
import { RANG_LABELS, RANG_EMOJI } from '@/lib/score-humanite'
import type { RangIdentity } from '@/types/vida'

type ProfileLite = {
  full_name: string | null
  plan: string
  score_humanite: number
  anciennete_months: number
  ville_principale: string | null
  awakening_level: number
  intro_seen: boolean
  onboarding_completed: boolean
  rang: RangIdentity
} | null

type WalletLite = {
  balance: number
  vida_credits: number
  total_earned: number
} | null

export function DashboardHello({
  email,
  profile,
  wallet,
}: {
  email: string
  profile: ProfileLite
  wallet: WalletLite
}) {
  const { signOut } = useAuth()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const firstName = profile?.full_name?.split(' ')[0] ?? null

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        {/* Header */}
        <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 via-cyan-400 to-violet-500 flex items-center justify-center text-black font-bold text-sm"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Y
            </span>
            <span className="font-bold text-base tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              YATRA
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/profile"
              aria-label="Mon profil"
              className="flex items-center gap-1.5 text-sm text-white/55 hover:text-white transition"
            >
              <span className="text-base">{profile?.rang ? RANG_EMOJI[profile.rang] : '🌱'}</span>
              <span className="hidden sm:inline">{profile?.rang ? RANG_LABELS[profile.rang] : 'Profil'}</span>
              <User size={16} className="sm:hidden" />
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              aria-label="Se déconnecter"
              className="text-sm text-white/55 hover:text-white transition flex items-center gap-1.5"
            >
              <LogOut size={16} /> <span className="hidden sm:inline">{signingOut ? '…' : 'Déconnexion'}</span>
            </button>
          </div>
        </header>

        <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
          {/* Greeting */}
          <div className="space-y-2">
            <p className="text-sm text-white/50">{getGreeting(firstName)}</p>
            <h1
              className="text-3xl md:text-4xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {firstName ? (
                <>
                  Bienvenue dans YATRA, <span className="gradient-text-aurora">{firstName}</span>
                </>
              ) : (
                <>Bienvenue dans YATRA</>
              )}
            </h1>
            <p className="text-white/55 max-w-xl">
              Tu viens d&apos;ouvrir un espace où chaque pas, chaque trajet propre, chaque droit activé te rapporte.
            </p>
          </div>

          {/* KPI cards */}
          <section className="grid sm:grid-cols-3 gap-4">
            <KpiCard
              icon={<Wallet size={20} />}
              label="Wallet"
              value={formatPrice(wallet?.balance ?? 0)}
              hint={`${formatPrice(wallet?.total_earned ?? 0)} gagnés au total`}
              color="emerald"
            />
            <KpiCard
              icon={<Sparkles size={20} />}
              label="Vida Credits"
              value={`${(wallet?.vida_credits ?? 0).toFixed(2)}`}
              hint="Cumulés sur trajets propres"
              color="cyan"
            />
            <KpiCard
              icon={<Trophy size={20} />}
              label="Score d'Humanité"
              value={`${(profile?.score_humanite ?? 0).toFixed(1)} / 10`}
              hint={`Niveau d'éveil ${profile?.awakening_level ?? 1}`}
              color="violet"
            />
          </section>

          {/* Next steps */}
          <section className="grid sm:grid-cols-2 gap-4">
            <ActionCard
              title="Démarrer mon premier trajet"
              description="On calcule la combinaison la moins chère + la plus propre + la plus apaisante en 3 sec."
              icon={<Compass size={22} />}
              onClick={() => router.push('/dashboard/trajet')}
            />
            <ActionCard
              title="Mes trajets"
              description="Historique, gains cumulés, CO₂ évité. Toute ta progression mobilité propre."
              icon={<MapPin size={22} />}
              onClick={() => router.push('/dashboard/trajets')}
            />
          </section>

          {/* Account info */}
          <section className="glass rounded-2xl p-6 space-y-3 text-sm">
            <h2 className="font-semibold text-white/80" style={{ fontFamily: 'var(--font-display)' }}>
              Ton compte
            </h2>
            <div className="grid grid-cols-2 gap-3 text-white/65">
              <div>
                <span className="text-white/40 text-xs uppercase tracking-wider block mb-0.5">Email</span>
                {email}
              </div>
              <div>
                <span className="text-white/40 text-xs uppercase tracking-wider block mb-0.5">Plan</span>
                {labelForPlan(profile?.plan)}
              </div>
              <div>
                <span className="text-white/40 text-xs uppercase tracking-wider block mb-0.5">Ancienneté</span>
                {profile?.anciennete_months ?? 0} mois
              </div>
              <div>
                <span className="text-white/40 text-xs uppercase tracking-wider block mb-0.5">Ville</span>
                {profile?.ville_principale ?? '—'}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: string
  color: 'emerald' | 'cyan' | 'violet'
}) {
  const colorClass = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
    violet: 'text-violet-400 bg-violet-500/10',
  }[color]
  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>{icon}</div>
      <div>
        <p className="text-xs text-white/45 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold mt-1" style={{ fontFamily: 'var(--font-display)' }}>
          {value}
        </p>
        <p className="text-xs text-white/45 mt-1">{hint}</p>
      </div>
    </div>
  )
}

function ActionCard({
  title,
  description,
  icon,
  onClick,
  disabled,
  soonLabel,
}: {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
  soonLabel?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="glass rounded-2xl p-5 text-left hover:border-emerald-400/30 transition disabled:cursor-not-allowed disabled:opacity-70 group"
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400/15 to-cyan-400/15 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              {title}
            </h3>
            {soonLabel && (
              <span className="text-[10px] uppercase tracking-wider text-white/40 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                Bientôt · {soonLabel}
              </span>
            )}
          </div>
          <p className="text-sm text-white/55 leading-snug">{description}</p>
        </div>
      </div>
    </button>
  )
}

function labelForPlan(plan?: string) {
  switch (plan) {
    case 'premium_monthly':
      return 'Premium mensuel'
    case 'premium_annual':
      return 'Premium annuel'
    case 'lifetime':
      return 'À vie 💎'
    default:
      return 'Découverte'
  }
}
