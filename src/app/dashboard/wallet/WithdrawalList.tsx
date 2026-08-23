import { ArrowUpRight, Banknote } from 'lucide-react'
import { formatPrice, formatRelativeDate } from '@/lib/utils'

type Withdrawal = {
  id: string
  amount: number
  status: string
  bank_iban_last4: string | null
  requested_at: string
  completed_at: string | null
}

export function WithdrawalList({ withdrawals }: { withdrawals: Withdrawal[] }) {
  if (withdrawals.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-white/80 px-1 flex items-center gap-2">
        <ArrowUpRight size={14} /> Retraits
      </h2>
      <ul className="glass rounded-2xl divide-y divide-white/5">
        {withdrawals.map((w) => (
          <WithdrawalRow key={w.id} wd={w} />
        ))}
      </ul>
      <p className="text-[11px] text-white/35 px-1">
        Pré-Treezor : retraits validés manuellement par l&apos;équipe sous 48 h ouvrées.
      </p>
    </section>
  )
}

function WithdrawalRow({ wd }: { wd: Withdrawal }) {
  const colors: Record<string, string> = {
    pending: 'text-white/60 bg-white/5 border-white/10',
    pending_admin: 'text-amber-300 bg-amber-400/10 border-amber-400/30',
    processing: 'text-cyan-300 bg-cyan-400/10 border-cyan-400/30',
    completed: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/30',
    failed: 'text-rose-300 bg-rose-400/10 border-rose-400/30',
  }
  const cls = colors[wd.status] ?? colors.pending

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/55">
        <Banknote size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          IBAN ****{wd.bank_iban_last4 ?? '----'}
        </p>
        <p className="text-[11px] text-white/40 mt-0.5">
          Demandé {formatRelativeDate(wd.requested_at)}
          {wd.completed_at && ` · Versé ${formatRelativeDate(wd.completed_at)}`}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold">{formatPrice(Number(wd.amount))}</p>
        <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${cls}`}>
          {labelForStatus(wd.status)}
        </span>
      </div>
    </li>
  )
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
