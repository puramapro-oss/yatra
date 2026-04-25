import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validateIban } from '@/lib/iban'
import { requestWithdrawal } from '@/lib/wallet'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MIN_WITHDRAW = 5
const MIN_CLEAN_TRIPS = 3 // pré-Treezor anti-multi-account

const withdrawSchema = z.object({
  amount: z.number().min(MIN_WITHDRAW).max(10000),
  iban: z.string().min(15).max(40),
  holder_name: z.string().min(2).max(100),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const data = withdrawSchema.parse(body)

    // 1. Validation IBAN mod-97
    const ibanCheck = validateIban(data.iban)
    if (!ibanCheck.valid || !ibanCheck.last4) {
      return NextResponse.json(
        { error: ibanCheck.error ?? 'IBAN invalide' },
        { status: 400 },
      )
    }

    // 2. Anti-multi-account light : ≥ 3 trips clean validés
    const { count: cleanTripsCount } = await supabase
      .from('trips')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')

    if ((cleanTripsCount ?? 0) < MIN_CLEAN_TRIPS) {
      return NextResponse.json(
        {
          error: `Tu dois avoir validé au moins ${MIN_CLEAN_TRIPS} trajets propres avant ton premier retrait. Tu en as ${cleanTripsCount ?? 0}.`,
        },
        { status: 403 },
      )
    }

    // 3. Vérification 1 retrait pending max
    const { count: pendingCount } = await supabase
      .from('withdrawals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['pending', 'pending_admin', 'processing'])

    if ((pendingCount ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Un retrait est déjà en cours. Attends son traitement avant d\'en demander un autre.' },
        { status: 409 },
      )
    }

    // 4. RPC atomique
    const result = await requestWithdrawal({
      userId: user.id,
      amount: data.amount,
      ibanLast4: ibanCheck.last4,
      holderName: data.holder_name,
    })

    // 5. Fil de Vie événement
    await supabase.from('fil_de_vie').insert({
      user_id: user.id,
      app_slug: 'yatra',
      event_type: 'withdrawal_requested',
      payload: {
        withdrawal_id: result.withdrawal_id,
        amount: data.amount,
        iban_last4: ibanCheck.last4,
      },
      irreversible: true,
    })

    return NextResponse.json({
      withdrawal_id: result.withdrawal_id,
      new_balance: result.new_balance,
      status: result.status,
      iban_last4: ibanCheck.last4,
      country: ibanCheck.country,
    })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    // Postgres exception via RPC remontée verbatim
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
