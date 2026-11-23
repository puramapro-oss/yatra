import { z } from 'zod'

const place = z.string().transform((value) => value.normalize('NFC').trim().replace(/\s+/g, ' '))
  .pipe(z.string().min(2).max(80).regex(/[\p{L}\p{N}]/u))

export const alertConfigSchema = z.object({
  aeroport_depart: place,
  destination_souhaitee: place,
  budget_max_eur: z.number().finite().positive().max(20000).multipleOf(0.01).nullable().optional(),
})

export type AlertConfigInput = z.infer<typeof alertConfigSchema>
