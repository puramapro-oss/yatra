import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { createServiceClient, createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const COOKIE_DAYS = 30

function hashIp(ip: string, ua: string): string {
  return createHash('sha256').update(`${ip}|${ua}`).digest('hex')
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const url = new URL(request.url)

  const headers = request.headers
  const ip =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    '0.0.0.0'
  const ua = headers.get('user-agent') ?? ''
  const ipHash = hashIp(ip, ua)

  // Vérifier si la campagne existe et est active
  const svc = createServiceClient()
  const { data: campaign } = await svc
    .from('qr_campaigns')
    .select('id, active')
    .eq('campaign_slug', slug)
    .maybeSingle()

  if (!campaign) {
    // Campagne inexistante → redirect signup sans attribution
    return NextResponse.redirect(new URL('/signup', url.origin), 302)
  }

  if (!campaign.active) {
    // Campagne inactive → redirect signup avec message
    const dest = new URL('/signup', url.origin)
    dest.searchParams.set('info', 'qr_inactive')
    return NextResponse.redirect(dest, 302)
  }

  // Enregistrer le scan
  try {
    await svc.from('qr_scans').insert({
      campaign_id: campaign.id,
      ip_hash: ipHash,
      scanned_at: new Date().toISOString(),
      converted_to_signup: false,
      user_id: null,
    })
  } catch {
    // best effort, ne bloque pas la redirect
  }

  // Vérifier si déjà connecté
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Cookie 30j pour attribution différée
  const expires = new Date(Date.now() + COOKIE_DAYS * 24 * 60 * 60 * 1000)
  const dest = new URL(user ? '/dashboard' : '/signup', url.origin)
  if (!user) {
    dest.searchParams.set('qr_campaign', slug)
  }

  const res = NextResponse.redirect(dest, 302)
  res.cookies.set('yatra_qr', slug, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    expires,
    path: '/',
  })
  return res
}
