import type { Metadata, Viewport } from 'next'
import { Sora, DM_Sans } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/shared/ThemeProvider'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { CookieBanner } from '@/components/shared/CookieBanner'
import { InstallBanner } from '@/components/shared/InstallBanner'
import { OfflineBanner } from '@/components/shared/OfflineBanner'
import { SilentModeToggle } from '@/components/multisensoriel/SilentModeToggle'
import { LanguageSelector } from '@/components/layout/LanguageSelector'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://yatra.purama.dev'),
  title: {
    default: 'YATRA — voyage propre, payé, conscient',
    template: '%s — YATRA',
  },
  description:
    'YATRA transforme chaque déplacement en gain : argent, droits activés, impact, sens. Mobilité propre rémunérée + radar aides + IA conscience voyage.',
  keywords: [
    'yatra', 'voyage', 'mobilité propre', 'écomobilité', 'aides transport',
    'covoiturage', 'vélo', 'train low-cost', 'cashback voyage', 'purama',
  ],
  applicationName: 'YATRA',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'YATRA',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://yatra.purama.dev',
    siteName: 'YATRA',
    title: 'YATRA — voyage propre, payé, conscient',
    description:
      'Tu te déplaces proprement → tu es payé. Tu fais le bien → tu voyages presque gratuitement.',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'YATRA' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YATRA — l\'écosystème PURAMA',
    description: 'Mobilité propre rémunérée. Voyage conscient.',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://yatra.purama.dev' },
}

export const viewport: Viewport = {
  themeColor: '#0A0A0F',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      suppressHydrationWarning
      className={`${sora.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <ErrorBoundary>
              <OfflineBanner />
              {children}
              <Toaster position="top-right" theme="dark" richColors closeButton />
              <CookieBanner />
              <InstallBanner />
              <SilentModeToggle />
              <div className="fixed top-4 right-4 z-[100]">
                <LanguageSelector />
              </div>
            </ErrorBoundary>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
