import { Router } from 'express';
import { registerSchema, verifySchema, loginSchema, emailOnlySchema, demoLoginSchema } from '@crossroads/shared';
import { validate } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimits';
import { requireAuth } from '../../middleware/auth';
import { signSession } from '../../lib/jwt';
import { setSessionCookie, clearSessionCookie } from '../../lib/cookies';
import { prisma } from '../../lib/prisma';
import { toMe } from '../users/users.service';
import * as auth from './auth.service';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate({ body: registerSchema }), async (req, res) => {
  res.status(201).json({ data: await auth.register(req.valid.body) });
});

authRouter.post('/verify', authLimiter, validate({ body: verifySchema }), async (req, res) => {
  const user = await auth.verify(req.valid.body.email, req.valid.body.code);
  setSessionCookie(res, signSession(user.id, user.role));
  res.json({ data: toMe(user) });
});

authRouter.post('/resend-code', authLimiter, validate({ body: emailOnlySchema }), async (req, res) => {
  await auth.resend(req.valid.body.email);
  res.json({ data: { ok: true } });
});

authRouter.post('/login', authLimiter, validate({ body: loginSchema }), async (req, res) => {
  const user = await auth.login(req.valid.body.email, req.valid.body.password);
  setSessionCookie(res, signSession(user.id, user.role));
  res.json({ data: toMe(user) });
});

authRouter.post('/logout', requireAuth, (_req, res) => {
  clearSessionCookie(res);
  res.json({ data: { ok: true } });
});

authRouter.get('/me', async (req, res) => {
  if (!req.user) return res.json({ data: null });
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ data: user ? toMe(user) : null });
});

authRouter.post('/demo-login', validate({ body: demoLoginSchema }), async (req, res) => {
  const user = await auth.demoLogin(req.valid.body.handle);
  setSessionCookie(res, signSession(user.id, user.role));
  res.json({ data: toMe(user) });
});
