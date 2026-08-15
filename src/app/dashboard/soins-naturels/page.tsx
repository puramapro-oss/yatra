import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SoinsNaturelsView } from './SoinsNaturelsView'

export const dynamic = 'force-dynamic'

export default async function SoinsNaturelsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, ville_principale')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.onboarding_completed) redirect('/onboarding')

  const { data: soins } = await supabase
    .from('soins_naturels')
    .select('id, nom, categorie, description, ville, region, tarif_indicatif_min, tarif_indicatif_max, tarif_solidaire, description_tarif_solidaire, lien_officiel')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(50)

  return <SoinsNaturelsView soins={soins ?? []} userVille={profile?.ville_principale ?? null} />
}
