'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { useAuth } from '@/hooks/useAuth'

const PLANS = {
  free: {
    features: 4,
  },
  premium: {
    monthlyPrice: 9.9,
    features: 5,
  },
} as const

export default function PricingPage() {
  const t = useTranslations()
  const router = useRouter()
  const { user } = useAuth()

  function handleSelectPlan(planType: 'free' | 'premium') {
    if (!user) {
      router.push('/signup')
      return
    }
    if (planType === 'free') {
      router.push('/dashboard')
      return
    }
    // Premium → redirect vers Stripe checkout (à implémenter)
    router.push('/dashboard')
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        {/* Header */}
        <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
          <Link href="/" className="flex items-center gap-2" aria-label="YATRA">
            <span
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-violet-500 flex items-center justify-center text-black font-bold text-lg"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Y
            </span>
            <span className="font-bold text-lg tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              YATRA
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="text-sm text-white/70 hover:text-white transition">
                {t('common.navigation.dashboard')}
              </Link>
            ) : (
              <Link href="/login" className="text-sm text-white/70 hover:text-white transition">
                {t('common.buttons.login')}
              </Link>
            )}
          </div>
        </header>

        <div className="px-6 py-12 max-w-6xl mx-auto">
          {/* Titre */}
          <div className="text-center space-y-3 mb-12">
            <h1
              className="text-4xl md:text-5xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('pricing.title')}
            </h1>
            <p className="text-white/65 text-lg max-w-2xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </div>

          {/* Plans grid — 2 plans réels seulement (cf CGV `yatra-config.ts` + catalogue
              Stripe `src/lib/stripe.ts`). L'ancien 3e plan "lifetime 149€" affiché ici
              n'existait ni en CGV ni côté Stripe et son bouton d'achat n'était jamais
              implémenté (TODO) — supprimé, cf CONFORMITE.md gap #5. */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <PlanCard
              name={t('pricing.plans.free.name')}
              price={t('pricing.plans.free.price')}
              priceSubtitle={null}
              features={Array.from({ length: PLANS.free.features }, (_, i) =>
                t(`pricing.plans.free.features.${i}`)
              )}
              cta={t('pricing.cta')}
              onSelect={() => handleSelectPlan('free')}
              highlighted={false}
            />

            {/* Premium */}
            <PlanCard
              name={t('pricing.plans.premium.name')}
              price={t('pricing.plans.premium.price', { price: PLANS.premium.monthlyPrice.toFixed(1) })}
              priceSubtitle={null}
              features={Array.from({ length: PLANS.premium.features }, (_, i) =>
                t(`pricing.plans.premium.features.${i}`)
              )}
              cta={t('pricing.cta')}
              onSelect={() => handleSelectPlan('premium')}
              highlighted
            />
          </div>
        </div>
      </main>
    </>
  )
}

function PlanCard({
  name,
  price,
  priceSubtitle,
  features,
  cta,
  onSelect,
  highlighted,
}: {
  name: string
  price: string
  priceSubtitle: string | null
  features: string[]
  cta: string
  onSelect: () => void
  highlighted: boolean
}) {
  return (
    <div
      className={`glass rounded-3xl p-6 space-y-6 border transition ${
        highlighted
          ? 'border-emerald-400/40 bg-emerald-500/5 scale-105'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          {name}
        </h2>
        <div>
          <p
            className="text-4xl font-bold gradient-text-aurora"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {price}
          </p>
          {priceSubtitle && <p className="text-sm text-white/55 mt-1">{priceSubtitle}</p>}
        </div>
      </div>

      <ul className="space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <Check size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <span className="text-white/85">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        className={`w-full py-3.5 rounded-xl font-semibold text-sm transition ${
          highlighted
            ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-black hover:shadow-lg hover:shadow-emerald-500/30'
            : 'bg-white/10 text-white hover:bg-white/15'
        }`}
      >
        {cta}
        <ArrowRight size={16} className="inline ml-1.5" />
      </button>
    </div>
  )
}
