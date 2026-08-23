import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { locales, defaultLocale } from './routing'

export default getRequestConfig(async () => {
  const store = await cookies()
  const cookieLocale = store.get('NEXT_LOCALE')?.value

  // Validate cookie locale against supported locales
  const isValidLocale = (value: string): value is typeof locales[number] => {
    return (locales as readonly string[]).includes(value)
  }

  const locale = cookieLocale && isValidLocale(cookieLocale)
    ? cookieLocale
    : defaultLocale

  const messages = (await import(`../../messages/${locale}.json`)).default

  return {
    locale,
    messages,
  }
})
