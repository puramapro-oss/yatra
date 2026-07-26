import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { isValidCagnotteCode } from '@/lib/vacances/cagnotte'
import { CagnottePublicView } from './CagnottePublicView'

export const dynamic = 'force-dynamic'

export default async function CagnottePublicPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  if (!isValidCagnotteCode(code)) notFound()

  const supabase = createServiceClient()
  const { data: cagnotte } = await supabase
    .from('vacances_cagnottes')
    .select('titre, destination, objectif_eur, montant_actuel_eur, statut')
    .eq('lien_partage_code', code.toUpperCase())
    .maybeSingle()

  if (!cagnotte) notFound()

  return <CagnottePublicView code={code.toUpperCase()} cagnotte={cagnotte} />
}
