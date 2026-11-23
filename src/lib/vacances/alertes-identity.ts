import { createHash } from 'node:crypto'
import { normalize } from './alertes.ts'
import type { AlertConfigInput } from './alertes-input.ts'

export function alertConfigKey(input: AlertConfigInput): string {
  return JSON.stringify([normalize(input.aeroport_depart), normalize(input.destination_souhaitee), input.budget_max_eur ?? null])
}

/** UUID v5: user-scoped identity makes concurrent identical creates idempotent. */
export function alertConfigId(userId: string, input: AlertConfigInput): string {
  const namespace = Buffer.from(userId.replace(/-/g, ''), 'hex')
  const bytes = createHash('sha1').update(namespace).update(alertConfigKey(input)).digest().subarray(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
