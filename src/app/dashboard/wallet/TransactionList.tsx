import { ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react'
import { formatPrice, formatRelativeDate } from '@/lib/utils'

type Tx = {
  id: string
  type: 'credit' | 'debit' | 'withdrawal' | 'refund'
  amount: number
  balance_after: number | null
  source: string
  description: string | null
  status: string | null
  created_at: string
}

export function TransactionList({ transactions }: { transactions: Tx[] }) {
  if (transactions.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white/80 px-1 flex items-center gap-2">
          <Clock size={14} /> Historique récent
        </h2>
        <div className="glass rounded-2xl p-8 text-center text-sm text-white/55">
          Aucun mouvement pour l&apos;instant. Commence par un trajet propre 🚲
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-white/80 px-1 flex items-center gap-2">
        <Clock size={14} /> Historique récent
      </h2>
      <ul className="glass rounded-2xl divide-y divide-white/5">
        {transactions.map((t) => (
          <TxRow key={t.id} tx={t} />
        ))}
      </ul>
    </section>
  )
}

function TxRow({ tx }: { tx: Tx }) {
  const isCredit = tx.type === 'credit' || tx.type === 'refund'
  const Icon = isCredit ? ArrowDownLeft : ArrowUpRight
  const color = isCredit ? 'text-emerald-400' : 'text-rose-400'
  const sign = isCredit ? '+' : '−'

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className={`w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center ${color}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">
          {tx.description ?? labelForSource(tx.source)}
        </p>
        <p className="text-[11px] text-white/40 mt-0.5">
          {formatRelativeDate(tx.created_at)}
          {tx.status && tx.status !== 'completed' && (
            <span className="ml-2 px-1 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30 text-[9px] uppercase">
              {labelForStatus(tx.status)}
            </span>
          )}
        </p>
      </div>
      <div className={`text-right ${color}`}>
        <p className="text-sm font-semibold">
          {sign}
          {formatPrice(Math.abs(Number(tx.amount)))}
        </p>
        {tx.balance_after !== null && (
          <p className="text-[10px] text-white/35">→ {formatPrice(Number(tx.balance_after))}</p>
        )}
      </div>
    </li>
  )
}

function labelForSource(s: string): string {
  switch (s) {
    case 'trip_clean': return 'Trajet propre'
    case 'referral': return 'Parrainage'
    case 'contest': return 'Concours'
    case 'lottery': return 'Tirage au sort'
    case 'redistribution': return 'Redistribution'
    case 'withdrawal': return 'Retrait IBAN'
    case 'manual_admin': return 'Crédit admin'
    case 'mission': return 'Mission'
    default: return s
  }
}

function labelForStatus(s: string): string {
  switch (s) {
    case 'pending': return 'En attente'
    case 'pending_admin': return 'À valider'
    case 'processing': return 'En cours'
    case 'completed': return 'Terminé'
    case 'failed': return 'Échec'
    default: return s
  }
}
