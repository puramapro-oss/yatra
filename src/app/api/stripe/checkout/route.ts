import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createYatraCheckoutSession } from '@/lib/stripe'
import { APP_DOMAIN } from '@/lib/constants'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const checkoutSchema = z.object({
  plan: z.enum(['premium_monthly', 'premium_annual', 'lifetime_anti_churn']),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { plan } = checkoutSchema.parse(body)

    const origin = request.headers.get('origin') ?? `https://${APP_DOMAIN}`
    const session = await createYatraCheckoutSession({
      userId: user.id,
      email: user.email,
      plan,
      successUrl: `${origin}/dashboard/settings/abonnement?checkout=success`,
      cancelUrl: `${origin}/dashboard/settings/abonnement?checkout=cancel`,
    })

    if (!session.url) {
      return NextResponse.json({ error: 'Impossible de créer la session de paiement. Réessaie.' }, { status: 502 })
    }

    return NextResponse.json({ url: session.url })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Plan invalide', details: e.issues }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
