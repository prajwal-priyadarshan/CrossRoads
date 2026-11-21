import type { OpenAI } from 'openai';
import type { z } from 'zod';
import { logger } from './logger';
import { env } from '../config/env';
import { LIMITS } from '../config/constants';

export class AIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIError';
  }
}

export type GenerateJSONInput<T> = {
  /** Short label for logs and usage tracking: answer, summary, roadmap, sim-question, … */
  feature: string;
  system: string;
  user: string;
  /** Validates the reply. Its output type is what the call returns. */
  schema: z.ZodType<T, z.ZodTypeDef, unknown>;
  /** Completion budget; defaults to AI_MAX_TOKENS and never goes below LIMITS.AI_MIN_COMPLETION_TOKENS */
  maxTokens?: number;
};

// One client for the process, created on first use so the SDK is only loaded when AI is configured
let client: Promise<OpenAI> | null = null;
function getClient() {
  client ??= import('openai').then(
    ({ OpenAI }) =>
      new OpenAI({
        apiKey: env.AI_API_KEY,
        baseURL: env.AI_BASE_URL,
        timeout: env.AI_TIMEOUT_MS,
        // The SDK retries 429, 5xx, connection errors and timeouts itself, with exponential backoff
        maxRetries: env.AI_RETRIES,
      }),
  );
  return client;
}

/** Strips the code fence some models wrap around JSON even in JSON mode. */
export const stripCodeFence = (text: string) => text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

/**
 * Asks the model for a JSON object and validates it with `schema`. Throws AIError when AI is off, the call
 * fails, or the reply is not valid JSON of the right shape; every caller has a non-AI fallback for that.
 * Logs one usage line per call. Prompts and replies are never logged at info level.
 */
export async function generateJSON<T>({ feature, system, user, schema, maxTokens }: GenerateJSONInput<T>): Promise<T> {
  if (!env.AI_API_KEY) throw new AIError('AI is not enabled');

  const started = Date.now();
  const usage = (ok: boolean, extra: Record<string, unknown> = {}, tokens?: OpenAI.CompletionUsage) =>
    logger.info(
      {
        feature,
        model: env.AI_MODEL,
        ms: Date.now() - started,
        promptTokens: tokens?.prompt_tokens,
        completionTokens: tokens?.completion_tokens,
        ok,
        ...extra,
      },
      'ai call',
    );

  let completion: OpenAI.ChatCompletion;
  try {
    completion = await (
      await getClient()
    ).chat.completions.create({
      model: env.AI_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      // Reasoning models spend tokens thinking first; keep that short and leave room for the JSON itself
      reasoning_effort: 'low',
      max_tokens: Math.max(maxTokens ?? env.AI_MAX_TOKENS, LIMITS.AI_MIN_COMPLETION_TOKENS),
    });
  } catch (err) {
    // After the SDK's own retries. Callers fall back, so this is a warning, not an error response
    const status = (err as { status?: number }).status;
    usage(false, { error: err instanceof Error ? err.name : 'unknown', status });
    logger.warn({ feature, status, err: err instanceof Error ? err.message : String(err) }, 'AI provider call failed');
    throw new AIError('The AI provider did not answer');
  }

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    usage(false, { error: 'empty' }, completion.usage);
    throw new AIError('No content returned from AI');
  }

  let json: unknown;
  try {
    json = JSON.parse(stripCodeFence(content));
  } catch {
    usage(false, { error: 'not-json' }, completion.usage);
    logger.warn({ feature, finish: completion.choices[0]?.finish_reason, head: content.slice(0, 200) }, 'AI reply was not JSON');
    throw new AIError('Failed to parse AI response');
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    usage(false, { error: 'schema' }, completion.usage);
    logger.warn({ feature, issues: parsed.error.issues.slice(0, 3) }, 'AI reply did not match the schema');
    throw new AIError('AI reply did not match the expected shape');
  }
  usage(true, {}, completion.usage);
  return parsed.data;
}
