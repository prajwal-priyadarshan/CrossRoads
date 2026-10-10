import { Router } from 'express';
import type { AppConfig } from '@crossroads/shared';
import { aiEnabled, env } from '../../config/env';
import { prisma } from '../../lib/prisma';

export const systemRouter = Router();

/** Liveness + readiness: also checks the database so load balancers can route around a broken instance. */
systemRouter.get('/health', async (_req, res) => {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ data: { ok: true, db: 'up', dbLatencyMs: Date.now() - started, time: new Date().toISOString() } });
  } catch {
    res.status(503).json({ error: { code: 'UNAVAILABLE', message: 'Database unreachable' } });
  }
});

/** Public, non-secret settings for the web app (domain hint, demo login buttons, feature flags). */
systemRouter.get('/config', async (_req, res) => {
  const demoAccounts = env.DEMO_MODE
    ? await prisma.user.findMany({
        where: { handle: { in: env.DEMO_LOGIN_HANDLES }, email: { endsWith: env.DEMO_EMAIL_SUFFIX } },
        select: { handle: true, fullName: true, role: true, currentYear: true },
      })
    : [];
  // Keep the order given in DEMO_LOGIN_HANDLES
  demoAccounts.sort((a, b) => env.DEMO_LOGIN_HANDLES.indexOf(a.handle) - env.DEMO_LOGIN_HANDLES.indexOf(b.handle));
  const data: AppConfig = {
    appName: env.APP_NAME,
    allowedEmailDomains: env.ALLOWED_EMAIL_DOMAINS,
    demoMode: env.DEMO_MODE,
    demoAccounts,
    aiEnabled,
  };
  res.set('Cache-Control', 'public, max-age=60').json({ data });
});
