import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { askClaudeJSON } from '@/lib/claude'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SearchSchema = z.object({
  query: z.string().min(1).max(500),
})

type SearchResult = {
  type: 'trajet' | 'budget_inverse' | 'radar_gratuit' | 'aides' | 'ambigu'
  destination?: string
  budget_eur?: number
  jours?: number
  confidence: number
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const parsed = SearchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Payload invalide' }, { status: 400 })
    }

    // Rate limit: 30 recherches / 24h pour gratuit, illimité pour premium/lifetime
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('search_queries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', since)

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle()

    const isPaid = profile?.plan === 'premium' || profile?.plan === 'lifetime'
    if (!isPaid && (count ?? 0) >= 30) {
      return NextResponse.json(
        { error: 'Limite quotidienne atteinte (30 recherches/jour). Passe Premium pour recherches illimitées.' },
        { status: 429 },
      )
    }

    // Extraction structurée via Claude
    const systemPrompt = `Tu es un extracteur de requête de voyage YATRA.
La personne veut:
- planifier un TRAJET (Paris Lyon, comment aller à..., rejoindre...) → type "trajet" + destination si claire
- chercher des VACANCES dans un BUDGET INVERSÉ (ex: 500€ pour 5 jours) → type "budget_inverse" + budget_eur + jours si donnés
- découvrir des ÉVÉNEMENTS GRATUITS proches (musées gratuits, concerts, repas solidaires) → type "radar_gratuit"
- trouver des AIDES/DROITS (aides transport, logement, énergie, handicap, senior) → type "aides"
- si tu ne comprends PAS ou que c'est TROP FLOU → type "ambigu"

Réponds UNIQUEMENT en JSON :
{
  "type": "trajet"|"budget_inverse"|"radar_gratuit"|"aides"|"ambigu",
  "destination": "string ou null",
  "budget_eur": number ou null,
  "jours": number ou null,
  "confidence": 0.0-1.0
}

Exemples:
- "Je veux aller à Lyon demain" → {"type":"trajet","destination":"Lyon","confidence":0.95}
- "J'ai 600€ pour 7 jours de vacances" → {"type":"budget_inverse","budget_eur":600,"jours":7,"confidence":0.90}
- "Musées gratuits à Paris" → {"type":"radar_gratuit","confidence":0.85}
- "Aides transport étudiant" → {"type":"aides","confidence":0.85}
- "Je cherche quelque chose" → {"type":"ambigu","confidence":0.20}`

    const result = await askClaudeJSON<SearchResult>(
      systemPrompt,
      `Requête utilisateur : "${parsed.data.query}"`,
      { model: 'fast', maxTokens: 300 },
    )

    // Validation basique du JSON retourné
    const validTypes = ['trajet', 'budget_inverse', 'radar_gratuit', 'aides', 'ambigu']
    if (!validTypes.includes(result.type)) {
      result.type = 'ambigu'
      result.confidence = 0.3
    }

    // Stocke la recherche
    await supabase.from('search_queries').insert({
      user_id: user.id,
      query_text: parsed.data.query,
      detected_type: result.type,
      confidence: result.confidence,
      redirected_to: null, // sera mis à jour côté client après redirection
    })

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    console.error('[yatra/search] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 },
    )
  }
}
