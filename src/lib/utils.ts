import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const formatPrice = (n: number, currency = 'EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(n)

export const formatNumber = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

export const formatDate = (d: string | Date) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d))

export function formatRelativeDate(date: string | Date): string {
  const diffMin = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (diffMin < 1) return "À l'instant"
  if (diffMin < 60) return `Il y a ${diffMin} min`
  if (diffMin < 1440) return `Il y a ${Math.floor(diffMin / 60)} h`
  if (diffMin < 2880) return 'Hier'
  return formatDate(date)
}

export function getGreeting(name?: string | null): string {
  const h = new Date().getHours()
  const n = name ? ` ${name}` : ''
  if (h >= 5 && h < 12) return `Bonjour${n} ☀️`
  if (h >= 12 && h < 18) return `Bon après-midi${n} 👋`
  if (h >= 18 && h < 22) return `Bonsoir${n} 🌙`
  return `Tu voyages tard${n} 🌟`
}

export const getInitials = (name: string) =>
  name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)

export const stringToColor = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h)
  return ['#22C55E', '#06B6D4', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981', '#F472B6', '#3B82F6'][Math.abs(h) % 8]
}

export const isSuperAdmin = (email?: string | null) =>
  email === 'matiss.frasne@gmail.com' || email === 'tissma@purama.dev'

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function formatCo2(grams: number): string {
  if (grams < 1000) return `${Math.round(grams)} g CO₂`
  return `${(grams / 1000).toFixed(1)} kg CO₂`
}

export function ancienneteMultiplier(months: number): number {
  if (months <= 0) return 1
  if (months >= 12) return 2
  if (months >= 9) return 1.8
  if (months >= 6) return 1.5
  if (months >= 3) return 1.2
  return 1 + (months / 3) * 0.2
}
