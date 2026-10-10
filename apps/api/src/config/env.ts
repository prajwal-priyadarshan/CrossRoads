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
  // Alumni may register with any personal email as ALUMNI (open for now; restrict to AllowedEmail invites later)
  ALUMNI_OPEN_SIGNUP: bool('false'),
  // Dev/demo only: skip the emailed 6-digit code and mark new accounts verified. Refused in production (see below)
  AUTO_VERIFY_EMAIL: bool('false'),

  // Email
  EMAIL_MODE: z.enum(['console', 'resend']).default('console'),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Crossroads <no-reply@example.com>'),

  // AI (Phase 09)
  // Any OpenAI-compatible provider; defaults to Groq's free tier
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().url().default('https://api.groq.com/openai/v1'),
  AI_MODEL: z.string().default('llama-3.3-70b-versatile'),
  AI_MAX_TOKENS: z.coerce.number().int().positive().default(4_000),
  AI_TIMEOUT_MS: z.coerce.number().default(60_000),

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
export const isProd = env.NODE_ENV === 'production';
export const aiEnabled = Boolean(env.AI_API_KEY);
export const docsEnabled = env.API_DOCS_ENABLED ? env.API_DOCS_ENABLED === 'true' : !isProd;
