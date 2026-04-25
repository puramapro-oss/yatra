import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, ExternalLink, Calendar, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { rankGratuit, type GratuitEvent } from '@/lib/gratuit-matcher'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'

export const dynamic = 'force-dynamic'

const CATEGORY_EMOJI: Record<string, string> = {
  musee: '🏛️',
  atelier: '🎨',
  concert: '🎵',
  expo: '🖼️',
  repas_solidaire: '🍲',
  soin: '💆',
  sport: '⚽',
  culture: '🌳',
}

const CATEGORY_LABEL: Record<string, string> = {
  musee: 'Musée',
  atelier: 'Atelier',
  concert: 'Concert',
  expo: 'Expo',
  repas_solidaire: 'Repas solidaire',
  soin: 'Soins',
  sport: 'Sport',
  culture: 'Culture',
}

export default async function GratuitPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('ville_principale, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.onboarding_completed) redirect('/onboarding')

  const ville = profile?.ville_principale ?? 'Paris'
  const region = guessRegion(ville)

  const { data: events } = await supabase
    .from('gratuit_events')
    .select('*')
    .eq('active', true)

  const ranked = rankGratuit((events ?? []) as GratuitEvent[], { userCity: ville, userRegion: region })

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-white/60 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft size={18} />
            <span className="text-sm">Retour</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Radar gratuit
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-5xl mx-auto space-y-6">
          <section className="glass rounded-3xl p-6 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300">
              <Sparkles size={18} />
              <span className="text-xs uppercase tracking-wider">Près de toi à {ville}</span>
            </div>
            <p className="text-3xl font-bold gradient-text-aurora" style={{ fontFamily: 'var(--font-display)' }}>
              {ranked.length} événement{ranked.length > 1 ? 's' : ''} gratuit{ranked.length > 1 ? 's' : ''}
            </p>
            <p className="text-sm text-white/55 leading-relaxed">
              Musées, ateliers, repas solidaires, sport, culture. Accessibles en mobilité douce.
            </p>
          </section>

          {ranked.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-white/55 text-sm">
              Aucun événement détecté pour {ville}. Le radar tourne en continu.
            </div>
          ) : (
            <section className="grid sm:grid-cols-2 gap-3">
              {ranked.map((e) => (
                <article key={e.id} className="glass rounded-2xl p-4 space-y-3 hover:border-emerald-400/30 transition">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{CATEGORY_EMOJI[e.category] ?? '✨'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
                          {CATEGORY_LABEL[e.category] ?? e.category}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-white/55 border border-white/10 flex items-center gap-1">
                          <MapPin size={10} /> {e.city}
                        </span>
                        {e._distance_km != null && e._distance_km < 50 && (
                          <span className="text-[10px] uppercase tracking-wider text-white/40">{e._distance_km.toFixed(1)} km</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm mt-1.5 leading-tight">{e.title}</h3>
                    </div>
                  </div>

                  {e.description && <p className="text-xs text-white/55 line-clamp-3 leading-relaxed">{e.description}</p>}

                  {e.recurrence && (
                    <p className="text-[11px] text-white/40 flex items-center gap-1.5">
                      <Calendar size={11} /> {labelRecurrence(e.recurrence)}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                    {e.url_official && (
                      <a
                        href={e.url_official}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-300 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink size={11} /> En savoir plus
                      </a>
                    )}
                    {e.lat != null && e.lon != null && (
                      <Link
                        href={`/dashboard/trajet?to_lat=${e.lat}&to_lon=${e.lon}&to_label=${encodeURIComponent(e.title)}`}
                        className="text-xs text-emerald-300 hover:underline ml-auto flex items-center gap-1"
                      >
                        🚲 M&apos;y rendre
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
    </>
  )
}

function guessRegion(ville: string): string {
  const v = ville.toLowerCase()
  if (/(paris|versailles|nanterre|saint-denis|montreuil)/i.test(v)) return 'IDF'
  if (/(lyon|villeurbanne|grenoble)/i.test(v)) return 'AURA'
  if (/(toulouse|montpellier)/i.test(v)) return 'OCC'
  if (/(marseille|nice|aix)/i.test(v)) return 'PACA'
  return 'FR'
}

function labelRecurrence(r: string): string {
  switch (r) {
    case 'monthly_first_sunday': return '1er dimanche du mois'
    case 'weekly': return 'Hebdomadaire'
    case 'permanent': return 'Permanent'
    case 'one_off': return 'Événement annuel'
    default: return r
  }
}
