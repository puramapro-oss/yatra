'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Sparkles, LogOut, Compass, Wallet, Trophy, MapPin, User, Globe, ShoppingBag, Headphones, MessageCircle, Users, Radar, Shield, ShieldAlert, Megaphone, Award, Plane, Heart } from 'lucide-react'
import { CrossPromoBanner } from '@/components/promo/CrossPromoBanner'
import { NLUSearchBar } from '@/components/search/NLUSearchBar'
import { useAuth } from '@/hooks/useAuth'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { getGreeting, formatPrice } from '@/lib/utils'
import { RANG_LABELS, RANG_EMOJI } from '@/lib/score-humanite'
import type { RangIdentity } from '@/types/vida'
import { KpiCard } from '@/components/dashboard/DashboardKpiCards'
import { ActionCard } from '@/components/dashboard/ActionCard'
import { labelForPlan } from '@/lib/plan-labels'

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
  const t = useTranslations()
  const { signOut } = useAuth()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [greeting, setGreeting] = useState('')

  const firstName = profile?.full_name?.split(' ')[0] ?? null

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setGreeting(getGreeting(firstName))
  }, [firstName])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
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
              aria-label={t('dashboard.hello.profile')}
              className="flex items-center gap-1.5 text-sm text-white/55 hover:text-white transition"
            >
              <span className="text-base">{profile?.rang ? RANG_EMOJI[profile.rang] : '🌱'}</span>
              <span className="hidden sm:inline">{profile?.rang ? RANG_LABELS[profile.rang] : t('dashboard.hello.profile')}</span>
              <User size={16} className="sm:hidden" />
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              aria-label={t('dashboard.hello.logout')}
              className="text-sm text-white/55 hover:text-white transition flex items-center gap-1.5"
            >
              <LogOut size={16} /> <span className="hidden sm:inline">{signingOut ? '…' : t('dashboard.hello.logout')}</span>
            </button>
          </div>
        </header>

        <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
          <div className="space-y-2">
            <p className="text-sm text-white/50 min-h-5" suppressHydrationWarning>{greeting}</p>
            <h1
              className="text-3xl md:text-4xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {firstName ? (
                <>
                  {t('dashboard.hello.welcome', { name: firstName }).split(', ')[0]},{' '}
                  <span className="gradient-text-aurora">{firstName}</span>
                </>
              ) : (
                <>{t('dashboard.hello.welcomeFallback')}</>
              )}
            </h1>
            <p className="text-white/55 max-w-xl">
              {t('dashboard.hello.subtitle')}
            </p>
          </div>

          <NLUSearchBar />

          <section className="grid sm:grid-cols-3 gap-4">
            <KpiCard
              icon={<Wallet size={20} />}
              label={t('dashboard.stats.wallet')}
              value={formatPrice(wallet?.balance ?? 0)}
              hint={t('dashboard.stats.walletHint', { total: formatPrice(wallet?.total_earned ?? 0) })}
              color="emerald"
              href="/dashboard/wallet"
            />
            <KpiCard
              icon={<Sparkles size={20} />}
              label={t('dashboard.stats.vidaCredits')}
              value={`${(wallet?.vida_credits ?? 0).toFixed(2)}`}
              hint={t('dashboard.stats.vidaHint')}
              color="cyan"
            />
            <KpiCard
              icon={<Trophy size={20} />}
              label={t('dashboard.stats.humanityScore')}
              value={`${(profile?.score_humanite ?? 0).toFixed(1)} / 10`}
              hint={t('dashboard.stats.humanityHint', { level: profile?.awakening_level ?? 1 })}
              color="violet"
              href="/dashboard/profile"
            />
          </section>

          <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ActionCard title={t('dashboard.actions.trajet.title')} description={t('dashboard.actions.trajet.description')} icon={<Compass size={22} />} onClick={() => router.push('/dashboard/trajet')} />
            <ActionCard title={t('dashboard.actions.trajets.title')} description={t('dashboard.actions.trajets.description')} icon={<MapPin size={22} />} onClick={() => router.push('/dashboard/trajets')} />
            <ActionCard title={t('dashboard.actions.vacances.title')} description={t('dashboard.actions.vacances.description')} icon={<Plane size={22} />} onClick={() => router.push('/dashboard/vacances')} />
            <ActionCard title={t('dashboard.actions.aides.title')} description={t('dashboard.actions.aides.description')} icon={<Sparkles size={22} />} onClick={() => router.push('/dashboard/aides')} />
            <ActionCard title={t('dashboard.actions.gratuit.title')} description={t('dashboard.actions.gratuit.description')} icon={<Sparkles size={22} />} onClick={() => router.push('/dashboard/gratuit')} />
            <ActionCard title={t('dashboard.actions.groupes.title')} description={t('dashboard.actions.groupes.description')} icon={<Compass size={22} />} onClick={() => router.push('/dashboard/groupes')} />
            <ActionCard title={t('dashboard.actions.cashback.title')} description={t('dashboard.actions.cashback.description')} icon={<ShoppingBag size={22} />} onClick={() => router.push('/dashboard/cashback')} />
            <ActionCard title={t('dashboard.actions.soins.title')} description={t('dashboard.actions.soins.description')} icon={<Heart size={22} />} onClick={() => router.push('/dashboard/soins-naturels')} />
            <ActionCard title={t('dashboard.actions.humanitaire.title')} description={t('dashboard.actions.humanitaire.description')} icon={<Globe size={22} />} onClick={() => router.push('/dashboard/humanitaire')} />
            <ActionCard title={t('dashboard.actions.ambiance.title')} description={t('dashboard.actions.ambiance.description')} icon={<Headphones size={22} />} onClick={() => router.push('/dashboard/ambiance')} />
            <ActionCard title={t('dashboard.actions.aria.title')} description={t('dashboard.actions.aria.description')} icon={<MessageCircle size={22} />} onClick={() => router.push('/dashboard/aria')} />
            <ActionCard title={t('dashboard.actions.famille.title')} description={t('dashboard.actions.famille.description')} icon={<Users size={22} />} onClick={() => router.push('/dashboard/famille')} />
            <ActionCard title={t('dashboard.actions.radar.title')} description={t('dashboard.actions.radar.description')} icon={<Radar size={22} />} onClick={() => router.push('/dashboard/radar')} />
            <ActionCard title={t('dashboard.actions.challenges.title')} description={t('dashboard.actions.challenges.description')} icon={<Shield size={22} />} onClick={() => router.push('/dashboard/challenges')} />
            <ActionCard title={t('dashboard.actions.safety.title')} description={t('dashboard.actions.safety.description')} icon={<ShieldAlert size={22} />} onClick={() => router.push('/dashboard/safety')} />
            <ActionCard title={t('dashboard.actions.ambassadeur.title')} description={t('dashboard.actions.ambassadeur.description')} icon={<Megaphone size={22} />} onClick={() => router.push('/dashboard/ambassadeur')} />
            <ActionCard title={t('dashboard.actions.classement.title')} description={t('dashboard.actions.classement.description')} icon={<Award size={22} />} onClick={() => router.push('/dashboard/classement')} />
            <ActionCard title={t('dashboard.actions.concours.title')} description={t('dashboard.actions.concours.description')} icon={<Trophy size={22} />} onClick={() => router.push('/dashboard/concours')} />
          </section>

          <CrossPromoBanner />

          <section className="glass rounded-2xl p-6 space-y-3 text-sm">
            <h2 className="font-semibold text-white/80" style={{ fontFamily: 'var(--font-display)' }}>
              {t('dashboard.account.title')}
            </h2>
            <div className="grid grid-cols-2 gap-3 text-white/65">
              <div>
                <span className="text-white/40 text-xs uppercase tracking-wider block mb-0.5">{t('dashboard.account.email')}</span>
                {email}
              </div>
              <div>
                <span className="text-white/40 text-xs uppercase tracking-wider block mb-0.5">{t('dashboard.account.plan')}</span>
                {labelForPlan(profile?.plan, t)}
              </div>
              <div>
                <span className="text-white/40 text-xs uppercase tracking-wider block mb-0.5">{t('dashboard.account.seniority')}</span>
                {t('dashboard.account.seniorityMonths', { months: profile?.anciennete_months ?? 0 })}
              </div>
              <div>
                <span className="text-white/40 text-xs uppercase tracking-wider block mb-0.5">{t('dashboard.account.city')}</span>
                {profile?.ville_principale ?? t('dashboard.account.cityEmpty')}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
