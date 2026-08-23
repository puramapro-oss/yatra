import { Field } from '@/components/forms/Field'

type Props = {
  nomPartenaire: string
  setNomPartenaire: (v: string) => void
  unitPrice: string
  setUnitPrice: (v: string) => void
  groupPrice: string
  setGroupPrice: (v: string) => void
  partnerUrl: string
  setPartnerUrl: (v: string) => void
}

export function ActivitePartenaireFields({
  nomPartenaire,
  setNomPartenaire,
  unitPrice,
  setUnitPrice,
  groupPrice,
  setGroupPrice,
  partnerUrl,
  setPartnerUrl,
}: Props) {
  return (
    <>
      <Field label="Nom du partenaire">
        <input
          type="text"
          required
          value={nomPartenaire}
          onChange={(e) => setNomPartenaire(e.target.value)}
          placeholder="Ex. Kayak Loire Aventure"
          className="input"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prix individuel (€)">
          <input
            type="number"
            step="0.01"
            min={0}
            required
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            placeholder="ex 45"
            className="input"
          />
        </Field>
        <Field label="Prix groupe (€)">
          <input
            type="number"
            step="0.01"
            min={0}
            required
            value={groupPrice}
            onChange={(e) => setGroupPrice(e.target.value)}
            placeholder="ex 30"
            className="input"
          />
        </Field>
      </div>
      <Field label="URL partenaire (facultatif)">
        <input
          type="url"
          value={partnerUrl}
          onChange={(e) => setPartnerUrl(e.target.value)}
          placeholder="https://..."
          className="input"
        />
      </Field>
    </>
  )
}
