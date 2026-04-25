import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { computeUserShare, creditCashback, verifyWebhookSignature } from '@/lib/cashback'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const WebhookSchema = z.object({
  tracking_id: z.string().min(8).max(64),
  partner_slug: z.string().min(1).max(120),
  external_order_id: z.string().min(1).max(200),
  purchase_amount_eur: z.number().positive().max(100000),
  status: z.enum(['confirmed', 'cancelled']).default('confirmed'),
})

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const sig = request.headers.get('x-yatra-signature')

    if (!verifyWebhookSignature(rawBody, sig)) {
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
    }

    let parsed
    try {
      parsed = WebhookSchema.parse(JSON.parse(rawBody))
    } catch {
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: click, error: ce } = await supabase
      .from('cashback_clicks')
      .select('id, user_id, partner_id, converted')
      .eq('tracking_id', parsed.tracking_id)
      .maybeSingle()

    if (ce || !click) {
      return NextResponse.json({ error: 'Tracking inconnu' }, { status: 404 })
    }
    if (click.converted) {
      return NextResponse.json({ error: 'Tracking déjà converti' }, { status: 409 })
    }

    const { data: partner, error: pe } = await supabase
      .from('cashback_partners')
      .select('id, slug, name, commission_pct, user_share_pct, max_cashback_eur, min_purchase_eur')
      .eq('slug', parsed.partner_slug)
      .maybeSingle()

    if (pe || !partner || partner.id !== click.partner_id) {
      return NextResponse.json({ error: 'Partenaire mismatch' }, { status: 400 })
    }

    if (partner.min_purchase_eur && parsed.purchase_amount_eur < Number(partner.min_purchase_eur)) {
      return NextResponse.json({ error: 'Achat sous le minimum' }, { status: 400 })
    }

    if (parsed.status === 'cancelled') {
      await supabase.from('cashback_clicks').update({ converted: false }).eq('id', click.id)
      return NextResponse.json({ ok: true, status: 'cancelled' })
    }

    const { commissionTotal, userShare } = computeUserShare({
      purchaseAmountEur: parsed.purchase_amount_eur,
      commissionPct: Number(partner.commission_pct),
      userSharePct: Number(partner.user_share_pct),
      maxCashbackEur: partner.max_cashback_eur ? Number(partner.max_cashback_eur) : null,
    })

    const { data: tx, error: te } = await supabase
      .from('cashback_transactions')
      .insert({
        user_id: click.user_id,
        partner_id: partner.id,
        click_id: click.id,
        purchase_amount_eur: parsed.purchase_amount_eur,
        commission_total_eur: commissionTotal,
        user_share_eur: userShare,
        status: 'pending',
        external_order_id: parsed.external_order_id,
      })
      .select('id')
      .single()

    if (te || !tx) {
      return NextResponse.json({ error: 'Création transaction échouée' }, { status: 500 })
    }

    await supabase
      .from('cashback_clicks')
      .update({ converted: true, converted_at: new Date().toISOString() })
      .eq('id', click.id)

    const result = await creditCashback({ userId: click.user_id, txId: tx.id })

    return NextResponse.json({
      ok: true,
      tx_id: result.tx_id,
      amount_credited: result.amount_credited,
      partner: result.partner,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
