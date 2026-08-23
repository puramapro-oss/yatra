import { NextResponse, type NextRequest } from 'next/server'

/** Auth = Bearer CRON_SECRET ou header Vercel `x-vercel-cron` (même convention que les autres crons YATRA, cf api/cron/cleanup-aria). */
export function assertCronAuth(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (secret && auth === `Bearer ${secret}`) return null
  if (request.headers.get('x-vercel-cron') === '1') return null
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
