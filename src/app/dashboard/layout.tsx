import { createClient } from '@/lib/supabase/server'
import LegalReacceptanceGateClient from '@/components/legal/LegalReacceptanceGateClient'
import { computeDocsEnAttente } from '@/lib/legal/versions'
import type { LegalDocType } from '@/lib/legal/types'

/**
 * Layout minimal du dossier `dashboard/` : ne touche à aucun chrome existant (chaque page
 * gère déjà son propre header/redirect), ajoute uniquement le gate de ré-acceptation légale
 * (`LegalReacceptanceGate`, jusqu'ici jamais monté — cf CONFORMITE.md gap #3) en overlay
 * `fixed inset-0`, donc sans impact sur la mise en page des pages enfants.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Pas d'utilisateur → chaque page gère déjà sa propre redirection vers /login.
  // Ici on se contente de ne pas afficher de gate.
  let docsEnAttente: LegalDocType[] = []
  if (user) {
    // Best-effort : si `legal_acceptances` n'est pas encore joignable côté PostgREST
    // (migration non jouée), on n'affiche aucun gate plutôt que de faire planter le
    // dashboard pour tous les users.
    const { data: acceptances, error: acceptancesError } = await supabase
      .from('legal_acceptances')
      .select('doc_type, version')
      .eq('user_id', user.id)
    if (!acceptancesError) {
      const dernieresAcceptations = Object.fromEntries(
        (acceptances ?? []).map((a) => [a.doc_type, a.version])
      ) as Partial<Record<LegalDocType, string>>
      docsEnAttente = computeDocsEnAttente(dernieresAcceptations)
    }
  }

  return (
    <>
      {children}
      <LegalReacceptanceGateClient docsEnAttente={docsEnAttente} />
    </>
  )
}
