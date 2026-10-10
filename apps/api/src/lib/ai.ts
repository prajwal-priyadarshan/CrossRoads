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
  
  const completion = await openai.chat.completions.create({
    model: env.AI_MODEL || 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    response_format: { type: 'json_object' },
    max_tokens: maxTokens
  }, { timeout: Number(env.AI_TIMEOUT_MS) || 20000 });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new AIError('No content returned from AI');

  try {
    const json = JSON.parse(content);
    return schema.parse(json);
  } catch (e) {
    throw new AIError('Failed to parse AI response');
  }
}
