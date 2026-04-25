import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizeSlug } from '@/lib/ambassadeur'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const COOKIE_DAYS = 30

function hashIp(ip: string, ua: string): string {
  return createHash('sha256').update(`${ip}|${ua}`).digest('hex')
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params
  const slug = normalizeSlug(rawSlug)

  const url = new URL(request.url)
  const utm = {
    source: url.searchParams.get('utm_source') ?? undefined,
    medium: url.searchParams.get('utm_medium') ?? undefined,
    campaign: url.searchParams.get('utm_campaign') ?? undefined,
  }

  const headers = request.headers
  const ip =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    '0.0.0.0'
  const ua = headers.get('user-agent') ?? ''
  const referer = headers.get('referer') ?? null
  const ipHash = hashIp(ip, ua)

  // Track click via service-role (RPC bump compteur ambassadeur si trouvé)
  try {
    const supabase = createServiceClient()
    await supabase.rpc('track_ambassador_click_v1' as never, {
      p_slug: slug,
      p_ip_hash: ipHash,
      p_ua: ua,
      p_referer: referer,
      p_utm: utm,
    } as never)
  } catch {
    // best effort, ne bloque pas la redirect
  }

  // Cookie 30j
  const expires = new Date(Date.now() + COOKIE_DAYS * 24 * 60 * 60 * 1000)
  const dest = new URL('/signup', url.origin)
  dest.searchParams.set('ref', slug)

  const res = NextResponse.redirect(dest, 302)
  res.cookies.set('yatra_amb', slug, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    expires,
    path: '/',
  })
  return res
}
