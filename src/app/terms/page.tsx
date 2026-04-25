import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions générales d\'utilisation',
  description: 'CGU YATRA — règles d\'usage, abonnement, redistribution, anti-fraude.',
}

export default function TermsPage() {
  return (
    <main className="min-h-dvh max-w-3xl mx-auto px-6 py-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8">
        <ArrowLeft size={16} /> Accueil
      </Link>
      <article className="prose prose-invert max-w-none space-y-6">
        <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          Conditions générales d&apos;utilisation
        </h1>
        <p className="text-white/55 text-sm">En vigueur : 25 avril 2026</p>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold pt-4">1. Objet</h2>
          <p>
            YATRA est un service édité par SASU PURAMA permettant de : (a) tracker des trajets de mobilité propre,
            (b) recevoir des Vida Credits convertibles, (c) découvrir et activer des aides publiques et droits
            personnels, (d) participer à une communauté de voyage conscient.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold pt-4">2. Abonnement</h2>
          <ul className="space-y-2 list-disc pl-5 text-white/75">
            <li><strong>Plan Découverte</strong> (gratuit) : visualisation seule, pas de tracking.</li>
            <li><strong>Premium mensuel</strong> : 9,99 €/mois, –10 % sur le 1<sup>er</sup> mois (8,99 €).</li>
            <li><strong>Premium annuel</strong> : 71,93 €/an, soit 5,99 €/mois équivalent (–30 %).</li>
            <li><strong>Anti-churn</strong> : si tu te désabonnes, tu peux verrouiller un tarif à vie de 4,99 €/mois.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold pt-4">3. Redistribution du chiffre d&apos;affaires</h2>
          <p>
            Chaque mois, le CA est réparti ainsi (chiffres officiels Treezor — EME ACPR Société Générale) :
            50 % redistribués aux utilisateurs (Score d&apos;Humanité), 10 % à l&apos;Association PURAMA, 10 % à la
            réserve technique ADYA, 30 % à SASU PURAMA (0 % IS ZFRR Frasne pendant 5 ans).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold pt-4">4. Anti-fraude</h2>
          <p>
            YATRA détecte le téléphone-en-voiture vs vélo via capteurs (accéléromètre, gyroscope, GPS) et machine
            learning local. Toute fraude détectée entraîne : annulation des Vida Credits, suspension de compte si
            récidive. Conformité 100 % légale — uniquement droits, aides et partenariats existants.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold pt-4">5. Annulation</h2>
          <p>
            Tu peux annuler ton abonnement à tout moment depuis Paramètres → Abonnement (2 clics). Aucune pénalité.
            L&apos;accès reste actif jusqu&apos;à la fin de la période payée.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold pt-4">6. Wallet & retraits</h2>
          <p>
            Retraits possibles dès 5 € via Treezor SEPA instant. KYC requis au-delà de 1 000 € cumulés (anti-blanchiment LCB-FT).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold pt-4">7. Mineurs</h2>
          <p>
            16 ans minimum (DSA). Pour les utilisateurs de 16 à 18 ans, consentement parental requis.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold pt-4">8. TVA non applicable</h2>
          <p>
            Tarifs en euros, TVA non applicable au regard de l&apos;article 293 B du CGI.
          </p>
        </section>
      </article>
    </main>
  )
}
