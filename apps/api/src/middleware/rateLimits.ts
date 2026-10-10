import { rateLimit, type Options } from 'express-rate-limit';
import { env } from '../config/env';

const MIN = 60_000;

const limiter = (windowMs: number, limit: number, message: string, perUser: boolean) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    ...(perUser
      ? {
          keyGenerator: (req) => req.user?.id ?? req.ip ?? 'anon',
          validate: { keyGeneratorIpFallback: false } satisfies Partial<Options['validate']>,
        }
      : {}),
    handler: (_req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message } }),
  });

export const authLimiter = limiter(15 * MIN, env.RATE_LIMIT_AUTH_PER_15M, 'Too many attempts. Please wait a few minutes.', false);

export const writeLimiter = limiter(MIN, env.RATE_LIMIT_WRITE_PER_MIN, 'You are doing that too quickly. Slow down a little.', true);

export const aiLimiter = limiter(
  60 * MIN,
  env.RATE_LIMIT_AI_PER_HOUR,
  'You have used the AI features a lot this hour. Try again later.',
  true,
);
