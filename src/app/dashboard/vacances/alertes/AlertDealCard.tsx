import { AlertTriangle, ExternalLink } from 'lucide-react'
import { safeDealUrl } from '@/lib/vacances/alertes'
import type { AlertDeal } from '@/lib/vacances/alertes-types'
import { formatPrice } from '@/lib/utils'

function displayDate(value: string | null, includeTime = false): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    ...(includeTime ? { timeStyle: 'short' as const } : {}),
    timeZone: 'Europe/Paris',
  }).format(date)
}

export function AlertDealCard({ deal }: { deal: AlertDeal }) {
  const url = safeDealUrl(deal.url)
  const published = displayDate(deal.published_date)
  const detected = displayDate(deal.created_at, true)
  return (
    <article className="glass rounded-2xl p-4 flex items-start gap-3">
      <AlertTriangle aria-hidden="true" size={18} className="text-amber-300 flex-shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1 space-y-2">
        <h3 className="font-semibold text-sm break-words">{deal.titre}</h3>
        {deal.extrait && <p className="text-sm text-white/65 leading-relaxed line-clamp-3">{deal.extrait}</p>}
        <p className="text-sm text-emerald-300 font-semibold">
          {deal.prix_detecte_eur != null ? `Prix mentionné : ${formatPrice(deal.prix_detecte_eur)}` : 'Prix non précisé dans la source'}
        </p>
        <div className="text-xs text-white/60 space-y-1">
          <p>{published ? <>Source publiée le <time dateTime={deal.published_date ?? undefined}>{published}</time>.</> : 'Date de publication non précisée.'}</p>
          {detected && <p>Repéré le <time dateTime={deal.created_at}>{detected}</time> (heure de Paris).</p>}
          <p>Disponibilité, dates, bagages, taxes et frais à confirmer auprès du vendeur.</p>
        </div>
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm text-amber-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded-lg px-1">
            <ExternalLink aria-hidden="true" size={15} /> Consulter la source <span className="sr-only">pour {deal.titre} (nouvel onglet)</span>
          </a>
        ) : <p className="text-sm text-white/60">Le lien de cette source est indisponible.</p>}
      </div>
    </article>
  )
}
