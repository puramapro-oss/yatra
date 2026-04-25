import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { CinematicIntro } from '@/components/multisensoriel/CinematicIntro'

export default function Home() {
  return (
    <>
      <CinematicIntro />
      <NatureBackground />

      <main className="relative z-card min-h-dvh flex flex-col items-center justify-center px-6 py-12">
        {/* Header minimal */}
        <header className="absolute top-0 left-0 right-0 px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group" aria-label="YATRA">
            <span
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-violet-500 flex items-center justify-center text-black font-bold text-lg"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Y
            </span>
            <span className="font-bold text-lg tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              YATRA
            </span>
          </Link>
          <Link
            href="/login"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            Se connecter
          </Link>
        </header>

        {/* Hero accueil app — minimal, pas landing site web */}
        <div className="text-center max-w-xl space-y-8">
          {/* Symbole vivant */}
          <div className="relative w-28 h-28 mx-auto">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/30 via-cyan-400/30 to-violet-500/30 blur-2xl animate-pulse" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-emerald-400 via-cyan-400 to-violet-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <Sparkles className="text-black" size={36} strokeWidth={2.5} />
            </div>
          </div>

          {/* Promesse */}
          <div className="space-y-4">
            <h1
              className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className="text-white">Tu te déplaces proprement.</span>
              <br />
              <span className="gradient-text-aurora">Tu es payé.</span>
            </h1>

            <p className="text-base md:text-lg text-white/65 leading-relaxed max-w-md mx-auto">
              Mobilité propre rémunérée, droits activés automatiquement, voyage conscient.
              <br />
              <span className="text-white/45">Tout ce que tu fais de bien te rapporte.</span>
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/signup"
              className="btn-primary group"
              aria-label="Commencer gratuitement"
            >
              Commencer
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/login" className="btn-ghost" aria-label="Se connecter">
              J&apos;ai déjà un compte
            </Link>
          </div>

          <p className="text-xs text-white/35 pt-4">
            Aucune pub. Aucune toxicité. RGPD strict. Données hébergées en Europe 🇪🇺
          </p>
        </div>

        {/* Footer accueil minimal */}
        <footer className="absolute bottom-6 left-0 right-0 px-6 flex items-center justify-between text-xs text-white/30">
          <span>© 2026 PURAMA · SASU Frasne · ZFRR</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white/60 transition">Confidentialité</Link>
            <Link href="/terms" className="hover:text-white/60 transition">CGU</Link>
            <Link href="/legal" className="hover:text-white/60 transition">Mentions</Link>
          </div>
        </footer>
      </main>
    </>
  )
}
