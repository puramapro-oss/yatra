import type { Metadata } from 'next'
import LegalPage from '@/lib/legal/components/LegalPage'
import { buildMentionsLegales } from '@/lib/legal/content/mentions-legales'
import { YATRA_LEGAL_CONFIG } from '@/lib/legal/yatra-config'
import { CURRENT_LEGAL_VERSIONS, LEGAL_VERSIONS_HISTORY } from '@/lib/legal/versions'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales YATRA — éditeur, hébergeur, propriété intellectuelle.',
}

export default function MentionsLegalesPage() {
  const sections = buildMentionsLegales(YATRA_LEGAL_CONFIG)
  const derniere = LEGAL_VERSIONS_HISTORY.mentions[LEGAL_VERSIONS_HISTORY.mentions.length - 1]
  return (
    <LegalPage
      titre="Mentions légales"
      sections={sections}
      derniereMiseAJour={`${new Date(derniere.date).toLocaleDateString('fr-FR', { dateStyle: 'long' })} (version ${CURRENT_LEGAL_VERSIONS.mentions})`}
    />
  )
}
