import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CashbackView } from './CashbackView'

export const dynamic = 'force-dynamic'

export default async function CashbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.onboarding_completed) redirect('/onboarding')

  const { data: partners } = await supabase
    .from('cashback_partners')
    .select('id, slug, name, category, description, logo_url, commission_pct, user_share_pct, ethical_score, popularity_score, max_cashback_eur, min_purchase_eur, conditions')
    .eq('active', true)
    .order('popularity_score', { ascending: false })
    .limit(50)

  const { data: txs } = await supabase
    .from('cashback_transactions')
    .select('id, partner_id, purchase_amount_eur, user_share_eur, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const totalEarned = (txs ?? [])
    .filter((t) => t.status === 'confirmed' || t.status === 'paid')
    .reduce((s, t) => s + Number(t.user_share_eur), 0)

  return <CashbackView partners={partners ?? []} txs={txs ?? []} totalEarned={totalEarned} />
}
