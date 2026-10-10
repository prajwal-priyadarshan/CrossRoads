import { Router } from 'express';
import { z } from 'zod';
import { requireOnboarded } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { aiLimiter } from '../../middleware/rateLimits';
import { simStartSchema, simAnswerSchema } from '@crossroads/shared';
import { start, answerQuestion, finishSession, getSession, listSessions } from './sim.service';

export const simRouter = Router();

simRouter.post('/sessions', requireOnboarded, aiLimiter, validate({ body: simStartSchema }), async (req, res) => {
  res.status(201).json({ data: await start(req.user!.id, req.valid.body) });
});

simRouter.get('/sessions', requireOnboarded, async (req, res) => {
  const limit = Math.min(20, Number(req.query.limit) || 5);
  res.json({ data: await listSessions(req.user!.id, limit) });
});

simRouter.get('/sessions/:id', requireOnboarded, async (req, res) => {
  res.json({ data: await getSession(req.user!.id, String(req.params.id)) });
});

simRouter.post('/sessions/:id/answer', requireOnboarded, aiLimiter, validate({ body: simAnswerSchema }), async (req, res) => {
  res.json({ data: await answerQuestion(req.user!.id, String(req.params.id), req.valid.body) });
});

simRouter.post('/sessions/:id/finish', requireOnboarded, async (req, res) => {
  res.json({ data: await finishSession(req.user!.id, String(req.params.id)) });
});
