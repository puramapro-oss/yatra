import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales YATRA — éditeur, hébergeur, propriété intellectuelle.',
}

export default function LegalPage() {
  return (
    <main className="min-h-dvh max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8">
        <ArrowLeft size={16} /> Accueil
      </Link>
      <article className="prose prose-invert max-w-none space-y-6">
        <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          Mentions légales
        </h1>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold pt-4">Éditeur</h2>
          <ul className="list-disc pl-5 text-white/75 space-y-1">
            <li>Raison sociale : SASU PURAMA</li>
            <li>Siège social : 8 Rue Chapelle, 25560 Frasne, France</li>
            <li>Zone Franche de Recherche et Recouvrement (ZFRR)</li>
            <li>Directeur de publication : Tissma Frasne</li>
            <li>Contact : <a href="mailto:contact@purama.dev" className="text-emerald-400">contact@purama.dev</a></li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold pt-4">Hébergeur</h2>
          <p>
            Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA — front-end Edge.<br />
            Hostinger International Ltd. — VPS Allemagne pour Supabase self-hosted (auth.purama.dev).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold pt-4">Propriété intellectuelle</h2>
          <p>
            Le code source, les designs, les marques YATRA et PURAMA sont la propriété exclusive de SASU PURAMA.
            Toute reproduction non autorisée est interdite.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold pt-4">TVA</h2>
          <p>TVA non applicable, art. 293 B du Code Général des Impôts.</p>
        </section>
      </article>
    </main>
  )
}
