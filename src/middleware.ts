import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/privacy',
  '/terms',
  '/legal',
  '/offline',
  '/manifest.webmanifest',
  '/sw.js',
  '/robots.txt',
  '/sitemap.xml',
  '/favicon.ico',
])

const ADMIN_PATH = '/admin'
const SUPER_ADMIN_EMAILS = ['matiss.frasne@gmail.com', 'tissma@purama.dev']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const { pathname } = request.nextUrl

  // Bypass static assets, API, OAuth callback & ressources Next
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    pathname === '/callback' ||
    pathname.includes('.') /* assets statiques */
  ) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'yatra' as 'yatra' },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Routes publiques → toujours accessibles
  if (PUBLIC_ROUTES.has(pathname)) {
    // Si user authentifié et essaie d'accéder à login/signup → redirect dashboard
    if (user && (pathname === '/login' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  // Admin routes → super_admin uniquement
  if (pathname.startsWith(ADMIN_PATH)) {
    if (!user) {
      return NextResponse.redirect(new URL(`/login?next=${pathname}`, request.url))
    }
    if (!SUPER_ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  // Toute autre route privée → auth required
  if (!user) {
    return NextResponse.redirect(new URL(`/login?next=${pathname}`, request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - public files (images, manifest, sw)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon-|apple-icon|manifest|sw\\.js|robots|sitemap).*)',
  ],
}
