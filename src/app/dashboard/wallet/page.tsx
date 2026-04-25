import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WalletView } from './WalletView'

export const dynamic = 'force-dynamic'

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, anciennete_months, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.onboarding_completed) redirect('/onboarding')

  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance, vida_credits, total_earned, total_withdrawn, total_from_trajets, total_from_referrals, total_from_contests, bank_iban_last4, bank_holder_name')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: tx } = await supabase
    .from('wallet_transactions')
    .select('id, type, amount, balance_after, source, description, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  const { data: wd } = await supabase
    .from('withdrawals')
    .select('id, amount, status, bank_iban_last4, requested_at, completed_at')
    .eq('user_id', user.id)
    .order('requested_at', { ascending: false })
    .limit(20)

  const { count: cleanTrips } = await supabase
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'completed')

  return (
    <WalletView
      email={user.email!}
      fullName={profile?.full_name ?? null}
      ancienneteMonths={profile?.anciennete_months ?? 0}
      wallet={wallet}
      transactions={tx ?? []}
      withdrawals={wd ?? []}
      cleanTrips={cleanTrips ?? 0}
    />
  )
}
