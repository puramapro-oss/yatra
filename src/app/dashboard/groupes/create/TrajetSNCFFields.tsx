import { AlertCircle } from 'lucide-react'
import { Field } from '@/components/forms/Field'

type Props = {
  origine: string
  setOrigine: (v: string) => void
  destination: string
  setDestination: (v: string) => void
  dateDepart: string
  setDateDepart: (v: string) => void
  tarifIndividuel: string
  setTarifIndividuel: (v: string) => void
  reductionPct: string
  setReductionPct: (v: string) => void
}

export function TrajetSNCFFields({
  origine,
  setOrigine,
  destination,
  setDestination,
  dateDepart,
  setDateDepart,
  tarifIndividuel,
  setTarifIndividuel,
  reductionPct,
  setReductionPct,
}: Props) {
  return (
    <>
      <div className="glass-soft rounded-2xl p-4 flex items-start gap-3 text-sm text-amber-200/90">
        <AlertCircle size={18} className="shrink-0 mt-0.5" />
        <div>
          <strong>Réservation manuelle</strong> : YATRA ne réserve pas à votre place. Ce pool met en relation les
          utilisateurs intéressés par le même trajet. Une fois le seuil atteint, vous recevrez un code et un lien vers
          SNCF Connect pour réserver manuellement votre billet groupe.
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Origine">
          <input
            type="text"
            required
            value={origine}
            onChange={(e) => setOrigine(e.target.value)}
            placeholder="Ex. Paris"
            className="input"
          />
        </Field>
        <Field label="Destination">
          <input
            type="text"
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Ex. Lyon"
            className="input"
          />
        </Field>
      </div>
      <Field label="Date de départ souhaitée">
        <input
          type="date"
          required
          value={dateDepart}
          onChange={(e) => setDateDepart(e.target.value)}
          className="input"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tarif individuel estimé (€)">
          <input
            type="number"
            step="0.01"
            min={0}
            required
            value={tarifIndividuel}
            onChange={(e) => setTarifIndividuel(e.target.value)}
            placeholder="ex 75"
            className="input"
          />
        </Field>
        <Field label="Réduction groupe estimée (%)">
          <input
            type="number"
            min={0}
            max={100}
            required
            value={reductionPct}
            onChange={(e) => setReductionPct(e.target.value)}
            placeholder="ex 25"
            className="input"
          />
        </Field>
      </div>
    </>
  )
}
