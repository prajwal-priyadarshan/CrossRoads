import { Router } from 'express';
import { z } from 'zod';
import { requireOnboarded } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { answer, summary } from './ai.service';
// Skip aiLimiter for now to save time

export const aiRouter = Router();

aiRouter.post('/answer', requireOnboarded, validate({ body: z.object({ questionId: z.string().optional(), title: z.string().optional(), body: z.string().optional() }) }), async (req, res) => {
  const result = await answer(req.user!.id, req.valid.body);
  res.json({ data: result });
});

aiRouter.post('/summary', requireOnboarded, validate({ body: z.object({ postId: z.string().optional(), companySlug: z.string().optional() }) }), async (req, res) => {
  const result = await summary(req.user!.id, req.valid.body);
  res.json({ data: result });
});
