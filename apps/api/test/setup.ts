// Runs before every test file. src/config/env.ts validates process.env at import time, so without a local
// apps/api/.env (a fresh clone, CI) any test that imports it fails before running. Fill the required
// variables with harmless dummies, only when they are unset: a real .env, CI env or a test's own values win.
const defaults: Record<string, string> = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  JWT_SECRET: 'test-secret-'.padEnd(64, 'x'),
  ALLOWED_EMAIL_DOMAINS: 'amrita.edu',
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) process.env[key] = value;
}
