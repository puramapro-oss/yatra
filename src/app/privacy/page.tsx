import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Comment YATRA traite tes données personnelles. RGPD strict, hébergement Europe, zéro tracking publicitaire.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8">
        <ArrowLeft size={16} /> Accueil
      </Link>
      <article className="prose prose-invert max-w-none space-y-6">
        <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          Politique de confidentialité
        </h1>
        <p className="text-white/55 text-sm">Dernière mise à jour : 25 avril 2026</p>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold pt-4">1. Responsable du traitement</h2>
          <p>
            SASU PURAMA, 8 Rue Chapelle, 25560 Frasne (France). Contact DPO :{' '}
            <a href="mailto:matiss.frasne@gmail.com" className="text-emerald-400">matiss.frasne@gmail.com</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold pt-4">2. Données collectées</h2>
          <ul className="space-y-2 list-disc pl-5 text-white/75">
            <li><strong>Compte</strong> : email, prénom, mot de passe haché.</li>
            <li><strong>Profil mobilité</strong> (opt-in) : trajets GPS, modes de transport, fréquence.</li>
            <li><strong>Paiement</strong> : géré par Stripe (PCI-DSS niveau 1) — nous ne stockons aucune donnée carte.</li>
            <li><strong>Usage</strong> : pages vues, événements anonymisés, à des fins de fonctionnement et d&apos;amélioration interne uniquement.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold pt-4">3. Tracking GPS — opt-in explicite</h2>
          <p>
            La géolocalisation n&apos;est activée que pendant un trajet validé par toi. Aucun tracking en arrière-plan
            sans consentement clair. Tu peux désactiver à tout moment dans Paramètres.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold pt-4">4. Hébergement & sous-traitants</h2>
          <ul className="space-y-2 list-disc pl-5 text-white/75">
            <li>Supabase self-hosted (VPS Europe — Hostinger Allemagne).</li>
            <li>Vercel (CDN Edge).</li>
            <li>Stripe (paiements, USA — clauses contractuelles types).</li>
            <li>Treezor (wallet électronique, EME ACPR — Société Générale).</li>
            <li>Anthropic (Aria, USA — clauses contractuelles types, données minimales).</li>
            <li>Resend (emails transactionnels).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold pt-4">5. Tes droits RGPD</h2>
          <p>
            Tu peux à tout moment : accéder, corriger, exporter, supprimer tes données. Demande directe via les
            paramètres de ton compte ou par email à <a href="mailto:matiss.frasne@gmail.com" className="text-emerald-400">matiss.frasne@gmail.com</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold pt-4">6. Cookies</h2>
          <p>
            Cookies strictement fonctionnels uniquement (auth, préférences). Aucun cookie publicitaire, aucun pixel de tracking tiers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold pt-4">7. Conservation</h2>
          <p>
            Données de compte : tant que ton compte est actif. Données financières (factures, retraits) : 10 ans (obligation légale).
            Sur suppression de compte : anonymisation immédiate des données non-légales.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold pt-4">8. Réclamation</h2>
          <p>
            Tu peux saisir la CNIL (<a href="https://cnil.fr" className="text-emerald-400" target="_blank" rel="noopener noreferrer">cnil.fr</a>) si tu estimes que tes droits ne sont pas respectés.
          </p>
        </section>
      </article>
    </main>
  )
}
