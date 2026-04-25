import Link from 'next/link'
import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="text-center max-w-md space-y-5">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
          <WifiOff className="text-amber-400" size={32} />
        </div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Pas de réseau
        </h1>
        <p className="text-white/60">
          Tu n&apos;es plus connecté(e) à internet. Tes derniers trajets et infos sont en cache local.
        </p>
        <Link href="/" className="btn-primary">
          Réessayer
        </Link>
      </div>
    </main>
  )
}
