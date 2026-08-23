import { Field } from '@/components/forms/Field'

export function EventGratuitFields({ eventPrice, setEventPrice }: { eventPrice: string; setEventPrice: (v: string) => void }) {
  return (
    <Field label="Prix de l'event (€)">
      <input
        type="number"
        step="0.01"
        min={0}
        required
        value={eventPrice}
        onChange={(e) => setEventPrice(e.target.value)}
        placeholder="0 si gratuit, ou <10€ si peu cher"
        className="input"
      />
    </Field>
  )
}
