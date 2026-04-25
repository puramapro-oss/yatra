import Link from 'next/link'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="text-center max-w-md space-y-5">
        <div className="mx-auto w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center">
          <Compass className="text-cyan-400" size={32} />
        </div>
        <h1 className="text-5xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          404
        </h1>
        <p className="text-white/60">Cette destination n&apos;existe pas — ou plus.</p>
        <Link href="/" className="btn-primary">
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  )
}
