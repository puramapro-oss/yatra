/**
 * Tavily API wrapper (server-only).
 * Docs: https://docs.tavily.com/
 *
 * Modes :
 * - search : top N résultats web (rapide)
 * - extract : récupère le contenu d'une URL
 *
 * Usage YATRA : veille permanente aides FR (cron quotidien).
 */

import 'server-only'

const TAVILY_BASE = 'https://api.tavily.com'

export type TavilySearchResult = {
  title: string
  url: string
  content: string
  score: number
  published_date?: string | null
}

export type TavilySearchResponse = {
  query: string
  answer?: string
  results: TavilySearchResult[]
  response_time?: number
}

export type SearchOptions = {
  topic?: 'general' | 'news'
  max_results?: number
  include_domains?: string[]
  exclude_domains?: string[]
  search_depth?: 'basic' | 'advanced'
  days?: number // pour topic=news
}

export async function tavilySearch(query: string, opts: SearchOptions = {}): Promise<TavilySearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) throw new Error('TAVILY_API_KEY manquant')

  const r = await fetch(`${TAVILY_BASE}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      topic: opts.topic ?? 'general',
      search_depth: opts.search_depth ?? 'basic',
      max_results: opts.max_results ?? 8,
      include_domains: opts.include_domains,
      exclude_domains: opts.exclude_domains,
      days: opts.days,
      include_answer: true,
    }),
    next: { revalidate: 0 },
  })

  if (!r.ok) {
    const text = await r.text().catch(() => '')
    throw new Error(`Tavily search ${r.status}: ${text}`)
  }
  return r.json() as Promise<TavilySearchResponse>
}

/** Extrait le contenu textuel d'une URL pour analyse. */
export async function tavilyExtract(urls: string[]): Promise<{ url: string; raw_content: string }[]> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) throw new Error('TAVILY_API_KEY manquant')

  const r = await fetch(`${TAVILY_BASE}/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ urls }),
    next: { revalidate: 0 },
  })
  if (!r.ok) throw new Error(`Tavily extract ${r.status}`)
  const data = (await r.json()) as { results?: { url: string; raw_content: string }[] }
  return data.results ?? []
}
