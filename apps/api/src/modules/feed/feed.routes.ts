import { Router } from 'express';
import { feedQuerySchema } from '@bridgeup/shared';
import { requireOnboarded } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { getFeed } from './feed.service';

export const feedRouter = Router();

feedRouter.get('/feed', requireOnboarded, validate({ query: feedQuerySchema }), async (req, res) => {
  res.json({ data: await getFeed(req.user!.id, req.valid.query) });
});
