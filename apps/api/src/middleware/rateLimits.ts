import { rateLimit } from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please wait a few minutes.' } }),
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: 20,
  keyGenerator: (req) => req.user?.id ?? req.ip ?? 'anon',
  validate: { keyGeneratorIpFallback: false },
  handler: (_req, res) =>
    res
      .status(429)
      .json({ error: { code: 'RATE_LIMITED', message: 'You have used the AI features a lot this hour. Try again later.' } }),
});

export const writeLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  keyGenerator: (req) => req.user?.id ?? req.ip ?? 'anon',
  validate: { keyGeneratorIpFallback: false },
  handler: (_req, res) =>
    res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'You are doing that too quickly. Slow down a little.' } }),
});
