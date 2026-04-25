import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'node:crypto'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  request: Request,
  { params }: { params: Promise<{ partnerId: string }> },
) {
  try {
    const { partnerId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const isUuid = UUID_RX.test(partnerId)
    const { data: partner, error: pe } = await supabase
      .from('cashback_partners')
      .select('id, slug, redirect_url, active')
      .eq(isUuid ? 'id' : 'slug', partnerId)
      .maybeSingle()

    if (pe || !partner || !partner.active) {
      return NextResponse.json({ error: 'Partenaire introuvable' }, { status: 404 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
    const ipHash = ip ? createHash('sha256').update(ip).digest('hex').slice(0, 32) : null
    const ua = request.headers.get('user-agent')?.slice(0, 200) ?? null

    const { data: click, error: ce } = await supabase
      .from('cashback_clicks')
      .insert({
        user_id: user.id,
        partner_id: partner.id,
        ip_hash: ipHash,
        user_agent: ua,
      })
      .select('id, tracking_id')
      .single()

    if (ce || !click) {
      return NextResponse.json({ error: 'Tracking failed' }, { status: 500 })
    }

    const redirectUrl = partner.redirect_url.replace('{tracking_id}', click.tracking_id)

    return NextResponse.json({
      click_id: click.id,
      tracking_id: click.tracking_id,
      redirect_url: redirectUrl,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
