import type { Metadata } from 'next'
import LegalPage from '@/lib/legal/components/LegalPage'
import { buildCGU } from '@/lib/legal/content/cgu'
import { YATRA_LEGAL_CONFIG } from '@/lib/legal/yatra-config'
import { CURRENT_LEGAL_VERSIONS, LEGAL_VERSIONS_HISTORY } from '@/lib/legal/versions'

export const metadata: Metadata = {
  title: 'Conditions générales d\'utilisation',
  description: 'CGU YATRA — abonnement, redistribution, anti-fraude, wallet.',
}

export default function CguPage() {
  const sections = buildCGU(YATRA_LEGAL_CONFIG)
  const derniere = LEGAL_VERSIONS_HISTORY.cgu[LEGAL_VERSIONS_HISTORY.cgu.length - 1]
  return (
    <LegalPage
      titre="Conditions générales d'utilisation"
      sections={sections}
      derniereMiseAJour={`${new Date(derniere.date).toLocaleDateString('fr-FR', { dateStyle: 'long' })} (version ${CURRENT_LEGAL_VERSIONS.cgu})`}
    />
  )
}
