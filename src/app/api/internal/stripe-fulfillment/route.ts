import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe, getPlanByPriceId } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * VACANCES V2.0 §0 — fulfillment interne du webhook Stripe partagé écosystème.
 * ~/purama/WEBHOOK-MIGRATION.md : karma héberge l'unique endpoint Stripe (limite Stripe
 * = 16 endpoints/compte). karma vérifie signature + dédup une fois, relaie l'event brut ici
 * via x-internal-secret. On re-vérifie quand même la signature Stripe en défense en profondeur.
 */
export async function POST(request: Request) {
  try {
    const internalSecret = request.headers.get('x-internal-secret')
    if (!process.env.INTERNAL_WEBHOOK_SECRET || internalSecret !== process.env.INTERNAL_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const rawBody = await request.text()
    const signature = request.headers.get('x-stripe-signature')
    if (!signature) {
      return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret non configuré' }, { status: 500 })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
    } catch {
      return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
    }

    const supabase = createServiceClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        if (!userId) break

        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          const priceId = subscription.items.data[0]?.price?.id
          const planInfo = priceId ? getPlanByPriceId(priceId) : null

          if (planInfo) {
            await supabase
              .from('profiles')
              .update({
                plan: planInfo.plan,
                billing_period: planInfo.billing_period,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: subscription.id,
                subscription_status: 'active',
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId)
          }
        }

        if (session.amount_total) {
          await supabase.from('payments').insert({
            user_id: userId,
            stripe_payment_id: (session.payment_intent as string) ?? null,
            amount: session.amount_total / 100,
            amount_after_discount: (session.amount_total - (session.total_details?.amount_discount ?? 0)) / 100,
            discount_applied: (session.total_details?.amount_discount ?? 0) / 100,
            currency: session.currency ?? 'eur',
            status: 'succeeded',
            plan: session.metadata?.plan ?? null,
          })
        }
        break
      }

      case 'customer.subscription.created': {
        // Safety net si checkout.session.completed manqué — sync minimum idempotent.
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id
        if (!userId) break

        const priceId = subscription.items.data[0]?.price?.id
        const planInfo = priceId ? getPlanByPriceId(priceId) : null
        if (!planInfo) break

        await supabase
          .from('profiles')
          .update({
            plan: planInfo.plan,
            billing_period: planInfo.billing_period,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : subscription.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id
        if (!userId) break

        const priceId = subscription.items.data[0]?.price?.id
        const planInfo = priceId ? getPlanByPriceId(priceId) : null

        const isActive = subscription.status === 'active' || subscription.status === 'trialing'
        const updateData: Record<string, unknown> = {
          stripe_subscription_id: subscription.id,
          subscription_status: isActive ? 'active' : subscription.status === 'past_due' ? 'past_due' : 'cancelled',
          updated_at: new Date().toISOString(),
        }
        if (planInfo && isActive) {
          updateData.plan = planInfo.plan
          updateData.billing_period = planInfo.billing_period
        }

        await supabase.from('profiles').update(updateData).eq('id', userId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id
        if (!userId) break

        await supabase
          .from('profiles')
          .update({
            plan: 'free',
            billing_period: null,
            subscription_status: 'cancelled',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = String((invoice as unknown as Record<string, unknown>).subscription ?? '')
        if (!subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = subscription.metadata?.user_id
        if (!userId) break

        await supabase
          .from('profiles')
          .update({ subscription_status: 'active', updated_at: new Date().toISOString() })
          .eq('id', userId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = String((invoice as unknown as Record<string, unknown>).subscription ?? '')
        if (!subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = subscription.metadata?.user_id
        if (!userId) break

        await supabase
          .from('profiles')
          .update({ subscription_status: 'past_due', updated_at: new Date().toISOString() })
          .eq('id', userId)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
        if (!paymentIntentId) break

        await supabase
          .from('payments')
          .update({ status: 'refunded' })
          .eq('stripe_payment_id', paymentIntentId)
        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
