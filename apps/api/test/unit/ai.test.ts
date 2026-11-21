import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

// Stand-in for the OpenAI SDK: records how the client is built and what each call sends
const create = vi.fn();
const constructed: Array<Record<string, unknown>> = [];
vi.mock('openai', () => ({
  OpenAI: class {
    chat = { completions: { create } };
    constructor(opts: Record<string, unknown>) {
      constructed.push(opts);
    }
  },
}));

const reply = (content: string) => ({
  choices: [{ message: { content }, finish_reason: 'stop' }],
  usage: { prompt_tokens: 12, completion_tokens: 34 },
});

const schema = z.object({ answer: z.string() });

/** Fresh copy of lib/ai with AI switched on, so the lazily built client is rebuilt per test. */
async function loadAI(vars: Record<string, string> = {}) {
  vi.stubEnv('AI_API_KEY', 'test-key');
  vi.stubEnv('AI_RETRIES', '1');
  for (const [k, v] of Object.entries(vars)) vi.stubEnv(k, v);
  vi.resetModules();
  return import('../../src/lib/ai');
}

describe('generateJSON', () => {
  beforeEach(() => {
    create.mockReset();
    constructed.length = 0;
  });
  afterEach(() => vi.unstubAllEnvs());

  it('parses code-fenced JSON and returns the validated value', async () => {
    const { generateJSON } = await loadAI();
    create.mockResolvedValue(reply('```json\n{"answer":"yes"}\n```'));
    await expect(generateJSON({ feature: 'test', system: 's', user: 'u', schema })).resolves.toEqual({ answer: 'yes' });
  });

  it('throws AIError when the reply does not match the schema', async () => {
    const { generateJSON, AIError } = await loadAI();
    create.mockResolvedValue(reply('{"other":1}'));
    await expect(generateJSON({ feature: 'test', system: 's', user: 'u', schema })).rejects.toBeInstanceOf(AIError);
  });

  it('throws AIError when the reply is not JSON', async () => {
    const { generateJSON, AIError } = await loadAI();
    create.mockResolvedValue(reply('Sure! Here is your answer.'));
    await expect(generateJSON({ feature: 'test', system: 's', user: 'u', schema })).rejects.toBeInstanceOf(AIError);
  });

  it('turns a provider failure into AIError, so callers fall back', async () => {
    const { generateJSON, AIError } = await loadAI();
    create.mockRejectedValue(Object.assign(new Error('rate limited'), { status: 429 }));
    await expect(generateJSON({ feature: 'test', system: 's', user: 'u', schema })).rejects.toBeInstanceOf(AIError);
  });

  it('builds one client with the configured retries and timeout, and keeps the token floor', async () => {
    const { generateJSON } = await loadAI({ AI_RETRIES: '2', AI_TIMEOUT_MS: '5000' });
    create.mockResolvedValue(reply('{"answer":"a"}'));
    await generateJSON({ feature: 'test', system: 's', user: 'u', schema, maxTokens: 100 });
    await generateJSON({ feature: 'test', system: 's', user: 'u', schema });
    expect(constructed).toHaveLength(1);
    expect(constructed[0]).toMatchObject({ maxRetries: 2, timeout: 5000 });
    expect(create.mock.calls[0]![0].max_tokens).toBeGreaterThanOrEqual(1500);
  });

  it('refuses without an API key', async () => {
    const { generateJSON, AIError } = await loadAI({ AI_API_KEY: '' });
    await expect(generateJSON({ feature: 'test', system: 's', user: 'u', schema })).rejects.toBeInstanceOf(AIError);
    expect(create).not.toHaveBeenCalled();
  });
});
