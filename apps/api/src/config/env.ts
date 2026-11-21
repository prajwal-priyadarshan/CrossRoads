import 'dotenv/config';
import { z } from 'zod';

const bool = (def: 'true' | 'false') => z.enum(['true', 'false']).default(def).transform((v) => v === 'true');
const csv = z.string().transform((s) => s.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean));

/** Every runtime setting comes from the environment and is validated once at startup. */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  APP_NAME: z.string().default('Crossroads'),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).optional(),

  // Database
  DATABASE_URL: z.string().url(),

  // Auth
  JWT_SECRET: z.string().min(32),
  SESSION_DAYS: z.coerce.number().int().positive().default(7),
  ALLOWED_EMAIL_DOMAINS: csv,
  DEMO_MODE: bool('false'),
  DEMO_LOGIN_HANDLES: csv.default('ananya,rahul,meera,admin'),
  DEMO_EMAIL_SUFFIX: z.string().default('@demo.crossroads'),
  // Safeguarding (phase 12): harassment / safety escalation is emailed here in addition to the in-app coordinator queue.
  // Unconfigured is a deploy blocker for this feature, not a TODO — see docs/phases/phase-12.md §5.
  SAFEGUARDING_CONTACT_EMAIL: z.string().email().optional(),

  // Alumni may register with any personal email as ALUMNI (open for now; restrict to AllowedEmail invites later)
  ALUMNI_OPEN_SIGNUP: bool('false'),
  // Dev/demo only: skip the emailed 6-digit code and mark new accounts verified. Refused in production (see below)
  AUTO_VERIFY_EMAIL: bool('false'),
  // Explicit opt-in for the demo shortcuts above and DEMO_MODE. Never set on a deployment real users can reach:
  // NODE_ENV alone is not a safe signal, because a staging box often runs as development.
  ALLOW_DEMO_SHORTCUTS: bool('false'),

  // Email
  EMAIL_MODE: z.enum(['console', 'resend']).default('console'),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Crossroads <no-reply@example.com>'),

  // AI (Phase 09)
  // Any OpenAI-compatible provider; defaults to Groq's free tier
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().url().default('https://api.groq.com/openai/v1'),
  AI_MODEL: z.string().default('openai/gpt-oss-120b'),
  AI_MAX_TOKENS: z.coerce.number().int().positive().default(4_000),
  AI_TIMEOUT_MS: z.coerce.number().default(60_000),

  // Project guide (RAG chatbot): folder of the project's own docs, relative to apps/api. README.md sits one level above it.
  PROJECT_DOCS_DIR: z.string().default('../../docs'),

  // Academic calendar: month (1-12) the odd semester starts, used to compute a student's current semester
  ACADEMIC_YEAR_START_MONTH: z.coerce.number().int().min(1).max(12).default(7),

  // Rate limits (requests per window)
  RATE_LIMIT_AUTH_PER_15M: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_WRITE_PER_MIN: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_AI_PER_HOUR: z.coerce.number().int().positive().default(20),

  // API docs (Swagger UI at /api/docs); on by default outside production
  API_DOCS_ENABLED: z.enum(['true', 'false']).optional(),
});

// Empty strings in .env (placeholders such as AI_API_KEY=) mean "not set"
const raw = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== ''));
export const env = schema.parse(raw);
if (env.AUTO_VERIFY_EMAIL && env.NODE_ENV === 'production') {
  throw new Error('AUTO_VERIFY_EMAIL must be false in production');
}
if (env.ALUMNI_OPEN_SIGNUP && env.NODE_ENV === 'production') {
  // Production alumni come in through the admin invite list (AllowedEmail), not open sign-up
  throw new Error('ALUMNI_OPEN_SIGNUP must be false in production; invite alumni from the admin panel');
}

/** Demo shortcuts that are switched on. Each lets people skip a real check, so each needs ALLOW_DEMO_SHORTCUTS. */
export const demoShortcutsOn = (['AUTO_VERIFY_EMAIL', 'ALUMNI_OPEN_SIGNUP', 'DEMO_MODE'] as const).filter((k) => env[k]);
if (demoShortcutsOn.length && !env.ALLOW_DEMO_SHORTCUTS) {
  throw new Error(
    `${demoShortcutsOn.join(', ')} ${demoShortcutsOn.length > 1 ? 'are' : 'is'} on, but ALLOW_DEMO_SHORTCUTS is not set. ` +
      'These shortcuts let anyone skip email verification, sign up as an alumnus or sign in as a demo user. ' +
      'Turn them off, or set ALLOW_DEMO_SHORTCUTS=true on a local or demo machine that real users cannot reach.',
  );
}

export const isProd = env.NODE_ENV === 'production';
export const aiEnabled = Boolean(env.AI_API_KEY);
export const docsEnabled = env.API_DOCS_ENABLED ? env.API_DOCS_ENABLED === 'true' : !isProd;
