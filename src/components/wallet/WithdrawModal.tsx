'use client'

import { useState, useMemo } from 'react'
import { X, Loader2, Banknote, ShieldCheck, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { validateIban } from '@/lib/iban'
import { formatPrice } from '@/lib/utils'

export function WithdrawModal({
  maxAmount,
  defaultHolder,
  lastUsedIbanLast4,
  onClose,
  onSuccess,
}: {
  maxAmount: number
  defaultHolder: string
  lastUsedIbanLast4: string | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [amount, setAmount] = useState<string>(maxAmount >= 5 ? String(Math.min(maxAmount, 50)) : '5')
  const [iban, setIban] = useState('')
  const [holder, setHolder] = useState(defaultHolder)
  const [submitting, setSubmitting] = useState(false)

  const numericAmount = Number(amount)
  const ibanCheck = useMemo(() => (iban.length >= 15 ? validateIban(iban) : null), [iban])

  const canSubmit =
    !submitting &&
    numericAmount >= 5 &&
    numericAmount <= maxAmount &&
    holder.trim().length >= 2 &&
    ibanCheck?.valid === true

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const r = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          iban: iban.replace(/\s+/g, ''),
          holder_name: holder.trim(),
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Erreur retrait')
      toast.success(`Retrait de ${formatPrice(numericAmount)} demandé 🎉`, {
        description: 'Versement IBAN validé sous 48h ouvrées',
      })
      onSuccess()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md glass rounded-3xl p-6 space-y-5 shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-black">
              <Banknote size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
                Retirer en banque
              </h2>
              <p className="text-xs text-white/45">Disponible : {formatPrice(maxAmount)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-white/45 hover:text-white p-1 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-white/40 mb-1.5">
              Montant
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min={5}
                max={maxAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-400/50 outline-none transition pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">€</span>
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {[5, 25, Math.floor(maxAmount)]
                .filter((v, i, arr) => v >= 5 && v <= maxAmount && arr.indexOf(v) === i)
                .map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setAmount(String(preset))}
                    className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border border-white/10 hover:border-emerald-400/40 hover:bg-emerald-400/5 transition text-white/60"
                  >
                    {formatPrice(preset)}
                  </button>
                ))}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-white/40 mb-1.5">
              Titulaire du compte
            </label>
            <input
              type="text"
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              placeholder="Prénom Nom"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-400/50 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-white/40 mb-1.5">
              IBAN
              {lastUsedIbanLast4 && <span className="ml-2 text-white/35 normal-case">dernier utilisé : ****{lastUsedIbanLast4}</span>}
            </label>
            <input
              type="text"
              value={iban}
              onChange={(e) => setIban(e.target.value.toUpperCase())}
              placeholder="FR76 1234 5678 9012 3456 7890 123"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-emerald-400/50 outline-none transition font-mono tracking-wider"
              autoComplete="off"
              spellCheck={false}
            />
            {ibanCheck && (
              <p className={`text-[11px] mt-1 flex items-center gap-1 ${ibanCheck.valid ? 'text-emerald-400' : 'text-rose-400'}`}>
                {ibanCheck.valid ? (
                  <>
                    <ShieldCheck size={12} /> IBAN valide ({ibanCheck.country}) · ****{ibanCheck.last4}
                  </>
                ) : (
                  <>
                    <AlertCircle size={12} /> {ibanCheck.error}
                  </>
                )}
              </p>
            )}
          </div>

          <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-xl p-3 text-[11px] text-white/65 leading-relaxed flex gap-2">
            <ShieldCheck size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <p>
              Versement par virement SEPA sous 48 h ouvrées. L&apos;IBAN n&apos;est jamais stocké entièrement&nbsp;:
              seuls les 4 derniers chiffres restent en référence.
            </p>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Banknote size={18} />}
            Demander le retrait
          </button>
        </form>
      </div>
    </div>
  )
}
