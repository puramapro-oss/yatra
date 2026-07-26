import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, PlaneTakeoff, Landmark, RefreshCw, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'

export const dynamic = 'force-dynamic'

export default async function RecupererPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard/vacances" aria-label="Retour" className="text-white/60 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft size={18} />
            <span className="text-sm">Retour</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Récupérer de l&apos;argent
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-3">
          <RecupererCard
            href="/dashboard/vacances/recuperer/eu261"
            icon={<PlaneTakeoff size={20} />}
            title="Indemnisation vol (EU261)"
            description="Retard 3h+, annulation, refus d'embarquement — jusqu'à 600€/personne. 0% de commission, l'argent va directement sur ton compte."
            color="text-cyan-300"
          />
          <RecupererCard
            href="/dashboard/aides"
            icon={<Landmark size={20} />}
            title="Aides sociales vacances"
            description="VACAF, Chèques-Vacances ANCV, aides CE, bourses solidarité — teste ton éligibilité."
            color="text-emerald-300"
          />
          <RecupererCard
            href="/dashboard/vacances/recuperer/reservations"
            icon={<RefreshCw size={20} />}
            title="Rebooking automatique"
            description="Suis une réservation annulable — on te rappelle de vérifier si le prix a baissé."
            color="text-violet-300"
          />
        </div>
      </main>
    </>
  )
}

function RecupererCard({ href, icon, title, description, color }: { href: string; icon: React.ReactNode; title: string; description: string; color: string }) {
  return (
    <Link href={href} className="glass rounded-2xl p-5 flex items-center gap-4 hover:border-white/20 transition group">
      <div className={`${color} flex-shrink-0`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-xs text-white/55 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <ChevronRight size={18} className="text-white/30 group-hover:text-white/60 transition flex-shrink-0" />
    </Link>
  )
}
