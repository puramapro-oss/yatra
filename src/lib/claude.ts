import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export const MODELS = {
  fast: process.env.ANTHROPIC_MODEL_FAST || 'claude-haiku-4-5-20251001',
  main: process.env.ANTHROPIC_MODEL_MAIN || 'claude-sonnet-4-6',
  pro: process.env.ANTHROPIC_MODEL_PRO || 'claude-opus-4-7',
} as const

type ModelKey = keyof typeof MODELS

export async function askClaude(
  systemPrompt: string,
  userMessage: string,
  options: { model?: ModelKey; maxTokens?: number } = {},
) {
  const { model = 'main', maxTokens = 4096 } = options
  const response = await anthropic.messages.create({
    model: MODELS[model],
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })
  return response.content[0]?.type === 'text' ? response.content[0].text : ''
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
  options: { model?: ModelKey; maxTokens?: number } = {},
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
