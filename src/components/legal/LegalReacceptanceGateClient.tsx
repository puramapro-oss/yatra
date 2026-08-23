'use client'

import LegalReacceptanceGate from '@/lib/legal/components/LegalReacceptanceGate'
import type { LegalDocType } from '@/lib/legal/types'

async function acceptDoc(docType: LegalDocType) {
  const res = await fetch('/api/legal/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ docType }),
  })
  if (!res.ok) throw new Error('Enregistrement impossible')
}

export default function LegalReacceptanceGateClient({
  docsEnAttente,
}: {
  docsEnAttente: LegalDocType[]
}) {
  if (docsEnAttente.length === 0) return null
  return (
    <LegalReacceptanceGate appName="YATRA" docsEnAttente={docsEnAttente} onAccept={acceptDoc} />
  )
}
