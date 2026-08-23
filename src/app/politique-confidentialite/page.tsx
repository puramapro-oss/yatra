import type { Metadata } from 'next'
import LegalPage from '@/lib/legal/components/LegalPage'
import { buildPolitiqueConfidentialite } from '@/lib/legal/content/politique-confidentialite'
import { YATRA_LEGAL_CONFIG } from '@/lib/legal/yatra-config'
import { CURRENT_LEGAL_VERSIONS, LEGAL_VERSIONS_HISTORY } from '@/lib/legal/versions'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Comment YATRA traite tes données personnelles. RGPD, hébergement Europe, zéro tracking publicitaire.',
}

export default function PolitiqueConfidentialitePage() {
  const sections = buildPolitiqueConfidentialite(YATRA_LEGAL_CONFIG, process.env, [
    'Treezor (Société Générale) : gestion du wallet électronique et des retraits (établissement de monnaie électronique agréé ACPR, France).',
  ])
  const derniere = LEGAL_VERSIONS_HISTORY.confidentialite[LEGAL_VERSIONS_HISTORY.confidentialite.length - 1]
  return (
    <LegalPage
      titre="Politique de confidentialité"
      sections={sections}
      derniereMiseAJour={`${new Date(derniere.date).toLocaleDateString('fr-FR', { dateStyle: 'long' })} (version ${CURRENT_LEGAL_VERSIONS.confidentialite})`}
    />
  )
}
