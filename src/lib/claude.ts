import Anthropic from '@anthropic-ai/sdk'
import { smarana } from '@purama/smarana'

// streamClaude utilise encore Anthropic directement car smarana ne supporte pas le streaming (P0/P1)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export const MODELS = {
  fast: process.env.ANTHROPIC_MODEL_FAST || 'claude-haiku-4-5-20251001',
  main: process.env.ANTHROPIC_MODEL_MAIN || 'claude-sonnet-4-6',
  pro: process.env.ANTHROPIC_MODEL_PRO || 'claude-opus-4-7',
} as const

type ModelKey = keyof typeof MODELS

// Loi 1 SMARANA-BRIEF.md : "Aucune app n'appelle l'API directement. Tout passe par smarana.ask()."
// YATRA ne détient plus de client Anthropic pour askClaude/askClaudeJSON — mémoire cross-écosystème + cache + usage
// centralisés dans @purama/smarana (packages/smarana).
// EXCEPTION : streamClaude continue d'utiliser Anthropic directement car streaming non supporté P0/P1.
export async function askClaude(
  systemPrompt: string,
  userMessage: string,
  options: { model?: ModelKey; maxTokens?: number; userId?: string } = {},
) {
  const { model = 'main', maxTokens = 4096, userId } = options
  const result = await smarana.ask({
    appSlug: 'yatra',
    userId,
    system: systemPrompt,
    message: userMessage,
    tier: model, // ModelKey → ClaudeTier ('fast'/'main'/'pro' sont identiques)
    maxTokens,
  })
  return result.text
}

export async function streamClaude(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  options: { model?: ModelKey; maxTokens?: number } = {},
) {
  const { model = 'main', maxTokens = 4096 } = options
  return anthropic.messages.stream({
    model: MODELS[model],
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  })
}

export async function askClaudeJSON<T>(
  systemPrompt: string,
  userMessage: string,
  options: { model?: ModelKey; maxTokens?: number; userId?: string } = {},
): Promise<T> {
  const text = await askClaude(
    systemPrompt + '\n\nRéponds UNIQUEMENT en JSON valide, sans backticks, sans commentaires.',
    userMessage,
    options,
  )
  return JSON.parse(text) as T
}

export function selectModelForQuery(message: string, plan: 'free' | 'premium' | 'lifetime'): ModelKey {
  const words = message.split(/\s+/).length
  if (plan === 'free' || words < 20) return 'fast'
  if (words > 200) return 'pro'
  return 'main'
}
