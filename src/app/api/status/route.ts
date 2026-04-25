import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const buildSha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local'
  const region = process.env.VERCEL_REGION ?? 'local'
  return NextResponse.json(
    {
      status: 'ok',
      app: 'YATRA',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      build: buildSha,
      region,
      env: process.env.NODE_ENV,
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    },
  )
}
