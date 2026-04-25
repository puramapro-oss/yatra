import { NextResponse } from 'next/server'
import { CHALLENGE_TEMPLATES } from '@/lib/challenges'

export const dynamic = 'force-static'
export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ templates: CHALLENGE_TEMPLATES })
}
