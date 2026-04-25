import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: results } = await supabase
    .from('contests_results')
    .select('id, type, period_start, period_end, total_pool_eur, winners, total_distributed_eur, status, metadata, created_at')
    .eq('status', 'completed')
    .order('period_end', { ascending: false })
    .limit(20)

  return NextResponse.json({ results: results ?? [] })
}
