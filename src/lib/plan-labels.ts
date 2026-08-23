import type { useTranslations } from 'next-intl'

export function labelForPlan(plan: string | undefined, t: ReturnType<typeof useTranslations>) {
  if (plan === 'pro') return t('dashboard.plans.pro')
  if (plan === 'premium') return t('dashboard.plans.premium')
  return t('dashboard.plans.free')
}
