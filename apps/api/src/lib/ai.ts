import { logger } from './logger';
import { env } from '../config/env';

export class AIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIError';
  }
}

// Minimal generateJSON wrapper assuming OpenAI package is used if AI_API_KEY is present
export async function generateJSON({ system, user, schema, maxTokens }: any) {
  if (!env.AI_API_KEY) throw new AIError('AI is not enabled');

  const { OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: env.AI_API_KEY, baseURL: env.AI_BASE_URL });

  const completion = await openai.chat.completions.create(
    {
      model: env.AI_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      // Reasoning models spend tokens thinking first; keep that short and leave room for the JSON itself
      reasoning_effort: 'low',
      max_tokens: Math.max(Number(maxTokens) || 0, 1500),
    } as any,
    { timeout: Number(env.AI_TIMEOUT_MS) || 20000 },
  );

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) throw new AIError('No content returned from AI');

  // Some models wrap JSON in a code fence even in JSON mode
  const body = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    logger.warn({ finish: completion.choices[0]?.finish_reason, head: body.slice(0, 200) }, 'AI reply was not JSON');
    throw new AIError('Failed to parse AI response');
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    logger.warn({ issues: parsed.error.issues.slice(0, 3) }, 'AI reply did not match the schema');
    throw new AIError('AI reply did not match the expected shape');
  }
  return parsed.data;
}
