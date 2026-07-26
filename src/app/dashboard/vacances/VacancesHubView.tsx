'use client'

import Link from 'next/link'
import { ArrowLeft, Wallet2, MapPinned, PiggyBank, Bell, Home, Layers, MapPin, Ship, PartyPopper } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { formatPrice } from '@/lib/utils'

const OUTILS = [
  { titre: 'Alertes bons plans', description: 'Erreurs de tarif & bons plans détectés pour tes destinations.', icon: Bell, href: '/dashboard/vacances/alertes' },
  { titre: 'Logement à 0€', description: 'House-sitting, échange de maison, volontariat.', icon: Home, href: '/dashboard/vacances/logement-0e' },
  { titre: 'Stacking automatique', description: 'Cumule cashback + code promo sur chaque réservation.', icon: Layers, href: '/dashboard/vacances/stacking' },
  { titre: 'Sur place', description: 'Repas anti-gaspi, villes à transport gratuit, pass touristique.', icon: MapPin, href: '/dashboard/vacances/sur-place' },
  { titre: 'Cagnotte yatrage', description: 'Tes proches cotisent pour ton voyage, ça part sur ton wallet.', icon: PartyPopper, href: '/dashboard/vacances/cagnotte' },
  { titre: 'Repositionnement & dernière minute', description: 'Convoyage, aller simple bradé, croisières -70%.', icon: Ship, href: '/dashboard/vacances/repositionnement' },
]

export function VacancesHubView({ totalEur }: { totalEur: number }) {
  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" aria-label="Retour" className="text-white/60 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft size={18} />
            <span className="text-sm">Retour</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Vacances
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-8">
          <section className="text-center space-y-1">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Tes vacances au prix le plus bas
            </h2>
            <p className="text-white/55 text-sm max-w-md mx-auto">
              Zéro promesse irréaliste — chaque euro affiché est calculé, pas inventé.
            </p>
          </section>

          {totalEur > 0 && (
            <section className="glass rounded-3xl p-6 text-center space-y-1">
              <p className="text-xs uppercase tracking-wider text-white/50">YATRA t&apos;a fait économiser / récupérer</p>
              <p className="text-3xl font-bold gradient-text-aurora" style={{ fontFamily: 'var(--font-display)' }}>
                {formatPrice(totalEur)}
              </p>
            </section>
          )}

          <section className="grid sm:grid-cols-3 gap-4">
            <HeroCard
              icon={<PiggyBank size={24} />}
              titre="J'ai un budget"
              description="Dis-nous combien tu as — on te propose 5 destinations qui rentrent dedans, transport + logement inclus."
              href="/dashboard/vacances/budget"
            />
            <HeroCard
              icon={<MapPinned size={24} />}
              titre="J'ai une destination"
              description="Vrai prix total (bagages, sièges, transfert compris) avant de réserver quoi que ce soit."
              href="/dashboard/vacances/scanner"
            />
            <HeroCard
              icon={<Wallet2 size={24} />}
              titre="Récupérer de l'argent"
              description="Vol retardé/annulé, réservation trop chère : on t'aide à te faire rembourser."
              href="/dashboard/vacances/recuperer"
            />
          </section>

          <section className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-white/45">Plus d&apos;outils voyage</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {OUTILS.map((o) => {
                const Icon = o.icon
                return (
                  <Link key={o.href} href={o.href} className="glass rounded-2xl p-4 flex items-start gap-3 hover:border-cyan-400/30 transition">
                    <span className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-300 flex items-center justify-center flex-shrink-0">
                      <Icon size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{o.titre}</p>
                      <p className="text-xs text-white/50 mt-0.5 leading-snug">{o.description}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

function HeroCard({ icon, titre, description, href }: { icon: React.ReactNode; titre: string; description: string; href: string }) {
  return (
    <Link href={href} className="glass rounded-3xl p-6 space-y-3 hover:border-cyan-400/30 hover:-translate-y-0.5 transition flex flex-col">
      <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-400/20 text-cyan-300 flex items-center justify-center">
        {icon}
      </span>
      <div>
        <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>{titre}</h3>
        <p className="text-xs text-white/55 mt-1 leading-relaxed">{description}</p>
      </div>
    </Link>
  )
}
