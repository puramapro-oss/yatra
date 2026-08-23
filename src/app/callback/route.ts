import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CURRENT_LEGAL_VERSIONS } from '@/lib/legal/versions'
import type { LegalDocType } from '@/lib/legal/types'

const REQUIRED_DOCS: LegalDocType[] = ['cgu', 'cgv', 'confidentialite']

/**
 * OAuth callback handler.
 * Pattern @supabase/ssr → cookie store gère le PKCE verifier (vs localStorage avec supabase-js classique).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const errorDescription = searchParams.get('error_description')

  if (errorDescription) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    // Compte créé/connecté via Google : le clic sur "Continuer avec Google" vaut acceptation
    // (même logique zéro-case-à-cocher que LegalAcceptanceNotice côté formulaire email).
    // On n'enregistre que les documents jamais acceptés — jamais de ré-écriture d'un accepted_at existant.
    const user = data.session?.user
    if (user) {
      const { data: existing } = await supabase
        .from('legal_acceptances')
        .select('doc_type')
        .eq('user_id', user.id)
      const already = new Set((existing ?? []).map((r) => r.doc_type))
      const missing = REQUIRED_DOCS.filter((d) => !already.has(d))
      if (missing.length > 0) {
        await supabase.from('legal_acceptances').insert(
          missing.map((docType) => ({
            user_id: user.id,
            doc_type: docType,
            version: CURRENT_LEGAL_VERSIONS[docType],
            ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
            user_agent: request.headers.get('user-agent'),
          })),
        )
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
