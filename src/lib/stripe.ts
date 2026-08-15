import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
})

/**
 * YATRA pricing — 1 abonnement Premium (BRIEF §4).
 * Free = visuel only, ne peut RIEN faire (effet aspirationnel doux).
 * Premium mensuel 9.99€ (–10% premier mois = 8.99€).
 * Premium annuel 71.93€ (–30% = 5.99€/mois équivalent).
 * Anti-churn : si désabo → "Abo à vie 50%" 4.99€/mois à vie.
 */
export const YATRA_PLANS = {
  free: {
    label: 'Découverte',
    description: 'Tout voir, sans rien activer',
    monthly_eur: 0,
    annual_eur: 0,
    features: [
      'Voir trajets, aides, missions, communauté',
      'Pas de tracking',
      'Pas de gains',
      'Pas de réservation',
    ],
  },
  premium_monthly: {
    label: 'Premium mensuel',
    description: 'Tout débloqué, mois par mois',
    price_eur: 9.99,
    first_month_eur: 8.99,
    interval: 'month' as const,
    features: [
      'GPS tracking trajets propres',
      'Vida Credits illimités',
      'Aides & droits auto remplis',
      '6 modes ambiance multisensoriel',
      'YATRA conscience voyage',
      'Tirages au sort + concours',
    ],
  },
  premium_annual: {
    label: 'Premium annuel',
    description: '–30 % vs mensuel',
    price_eur: 71.93,
    monthly_equivalent_eur: 5.99,
    interval: 'year' as const,
    features: [
      'Tout Premium mensuel',
      'Économie 47.95€/an',
      'Bonus ancienneté immédiat',
    ],
  },
  lifetime_anti_churn: {
    label: 'Abo à vie –50 %',
    description: 'Proposition exclusive si tu te désabonnes',
    price_eur: 4.99,
    interval: 'month' as const,
    eligibility: 'sur cancellation flow uniquement',
    features: ['Tout Premium', 'Verrouillé 4.99€/mois à vie'],
  },
} as const

export type YatraPlanKey = keyof typeof YATRA_PLANS

export function formatYatraPrice(plan: YatraPlanKey): string {
  const p = YATRA_PLANS[plan]
  if (plan === 'free') return 'Gratuit'
  if ('price_eur' in p) return `${p.price_eur.toFixed(2).replace('.', ',')} €`
  return ''
}

/**
 * VACANCES V2.0 §0 — migration webhook Stripe partagé (~/purama/WEBHOOK-MIGRATION.md).
 * Price IDs créés côté Stripe (Products > Prices), 1 par plan payant. Tant que
 * STRIPE_SECRET_KEY n'est pas valide, ces env vars restent vides — createYatraCheckoutSession
 * lève une erreur FR explicite plutôt que d'appeler Stripe avec un price_id undefined.
 */
const STRIPE_PRICE_IDS: Record<'premium_monthly' | 'premium_annual' | 'lifetime_anti_churn', string | undefined> = {
  premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
  premium_annual: process.env.STRIPE_PRICE_PREMIUM_ANNUAL,
  lifetime_anti_churn: process.env.STRIPE_PRICE_LIFETIME_ANTI_CHURN,
}

/** Mappe plan DB (profiles.plan/billing_period) ↔ clé YATRA_PLANS. */
export const PLAN_TO_DB = {
  premium_monthly: { plan: 'premium_monthly', billing_period: 'monthly' },
  premium_annual: { plan: 'premium_annual', billing_period: 'annual' },
  lifetime_anti_churn: { plan: 'lifetime', billing_period: 'lifetime' },
} as const

/** Retrouve le plan YATRA à partir d'un Stripe price ID (webhook fulfillment). */
export function getPlanByPriceId(priceId: string): { key: YatraPlanKey; plan: string; billing_period: string } | null {
  const entry = (Object.entries(STRIPE_PRICE_IDS) as [keyof typeof STRIPE_PRICE_IDS, string | undefined][])
    .find(([, id]) => id && id === priceId)
  if (!entry) return null
  const [key] = entry
  return { key, ...PLAN_TO_DB[key] }
}

/** Crée la Checkout Session — metadata.app_slug='yatra' propagée sur session ET subscription (dispatcher central). */
export async function createYatraCheckoutSession(params: {
  userId: string
  email: string
  plan: 'premium_monthly' | 'premium_annual' | 'lifetime_anti_churn'
  successUrl: string
  cancelUrl: string
}) {
  const priceId = STRIPE_PRICE_IDS[params.plan]
  if (!priceId) {
    throw new Error(
      `Plan "${params.plan}" indisponible pour le moment : configuration Stripe incomplète côté serveur. Réessaie plus tard ou contacte le support.`,
    )
  }

  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: params.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { app_slug: 'yatra', user_id: params.userId, plan: params.plan },
    subscription_data: {
      metadata: { app_slug: 'yatra', user_id: params.userId, plan: params.plan },
    },
    allow_promotion_codes: true,
  }, {
    idempotencyKey: `checkout:${params.userId}:${params.plan}:${new Date().toISOString().slice(0, 10)}`,
  })
}
