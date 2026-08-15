import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['fr', 'en', 'es', 'de', 'it', 'pt', 'ar'],
  defaultLocale: 'fr',
  localePrefix: 'never',
})

export const locales = routing.locales
export const defaultLocale = routing.defaultLocale
