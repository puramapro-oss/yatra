import type { Metadata } from 'next'
import LegalPage from '@/lib/legal/components/LegalPage'
import { buildCGV } from '@/lib/legal/content/cgv'
import { YATRA_LEGAL_CONFIG } from '@/lib/legal/yatra-config'
import { CURRENT_LEGAL_VERSIONS, LEGAL_VERSIONS_HISTORY } from '@/lib/legal/versions'

export const metadata: Metadata = {
  title: 'Conditions générales de vente',
  description: 'CGV YATRA — tarifs, paiement, rétractation, résiliation.',
}

export default function CgvPage() {
  const sections = buildCGV(YATRA_LEGAL_CONFIG)
  const derniere = LEGAL_VERSIONS_HISTORY.cgv[LEGAL_VERSIONS_HISTORY.cgv.length - 1]
  return (
    <LegalPage
      titre="Conditions générales de vente"
      sections={sections}
      derniereMiseAJour={`${new Date(derniere.date).toLocaleDateString('fr-FR', { dateStyle: 'long' })} (version ${CURRENT_LEGAL_VERSIONS.cgv})`}
    />
  )
}
