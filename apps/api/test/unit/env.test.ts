import { afterEach, describe, expect, it, vi } from 'vitest';

// config/env.ts validates process.env when it is first imported, so each case stubs the environment,
// clears the module cache and imports it again.
async function loadEnv(vars: Record<string, string>) {
  for (const [k, v] of Object.entries(vars)) vi.stubEnv(k, v);
  vi.resetModules();
  return import('../../src/config/env');
}

const OFF = { AUTO_VERIFY_EMAIL: 'false', ALUMNI_OPEN_SIGNUP: 'false', DEMO_MODE: 'false' };

describe('demo shortcut guard', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('boots with every shortcut off', async () => {
    const { demoShortcutsOn } = await loadEnv({ ...OFF, ALLOW_DEMO_SHORTCUTS: 'false' });
    expect(demoShortcutsOn).toEqual([]);
  });

  it('refuses a shortcut without ALLOW_DEMO_SHORTCUTS, naming it', async () => {
    await expect(loadEnv({ ...OFF, AUTO_VERIFY_EMAIL: 'true', ALLOW_DEMO_SHORTCUTS: 'false' })).rejects.toThrow(
      /AUTO_VERIFY_EMAIL is on, but ALLOW_DEMO_SHORTCUTS is not set/,
    );
    await expect(loadEnv({ ...OFF, DEMO_MODE: 'true', ALLOW_DEMO_SHORTCUTS: 'false' })).rejects.toThrow(/DEMO_MODE/);
  });

  it('allows the shortcuts when explicitly opted in', async () => {
    const { demoShortcutsOn } = await loadEnv({
      AUTO_VERIFY_EMAIL: 'true',
      ALUMNI_OPEN_SIGNUP: 'true',
      DEMO_MODE: 'true',
      ALLOW_DEMO_SHORTCUTS: 'true',
    });
    expect(demoShortcutsOn).toEqual(['AUTO_VERIFY_EMAIL', 'ALUMNI_OPEN_SIGNUP', 'DEMO_MODE']);
  });

  it('still refuses AUTO_VERIFY_EMAIL in production, even when opted in', async () => {
    await expect(
      loadEnv({ ...OFF, NODE_ENV: 'production', AUTO_VERIFY_EMAIL: 'true', ALLOW_DEMO_SHORTCUTS: 'true' }),
    ).rejects.toThrow(/must be false in production/);
  });
});
