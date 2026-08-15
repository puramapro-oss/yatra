import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SurpriseView } from './SurpriseView'

export const metadata: Metadata = {
  title: 'Surprise parfaite · YATRA',
  description: 'Une destination proche + trajet minimal + activité gratuite + micro-défi positif en 10 secondes.',
}

export default function SurprisePage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">Chargement...</div>}>
      <SurpriseView />
    </Suspense>
  )
}
