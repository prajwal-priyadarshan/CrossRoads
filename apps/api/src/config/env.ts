import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  SESSION_DAYS: z.coerce.number().int().positive().default(7),
  ALLOWED_EMAIL_DOMAINS: z
    .string()
    .transform((s) => s.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean)),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  EMAIL_MODE: z.enum(['console', 'resend']).default('console'),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('BridgeUp <no-reply@example.com>'),
  DEMO_MODE: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('claude-sonnet-5-5'),
  AI_TIMEOUT_MS: z.coerce.number().default(20000),
});

export const env = schema.parse(process.env);
export const isProd = env.NODE_ENV === 'production';
export const aiEnabled = Boolean(env.ANTHROPIC_API_KEY);
