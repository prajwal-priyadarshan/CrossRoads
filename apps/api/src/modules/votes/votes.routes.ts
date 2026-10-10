import { Router } from 'express';
import { voteSchema } from '@bridgeup/shared';
import { requireOnboarded } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { writeLimiter } from '../../middleware/rateLimits';
import { castVote } from './votes.service';

export const votesRouter = Router();

votesRouter.put('/votes', requireOnboarded, writeLimiter, validate({ body: voteSchema }), async (req, res) => {
  res.json({ data: await castVote(req.user!.id, req.valid.body) });
});
