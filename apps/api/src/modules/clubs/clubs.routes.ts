import { Router } from 'express';
import { clubListQuerySchema, clubReviewSchema } from '@crossroads/shared';
import { requireOnboarded } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { writeLimiter } from '../../middleware/rateLimits';
import { getClub, listClubs, reviewClub } from './clubs.service';

export const clubsRouter = Router();

clubsRouter.get('/clubs', requireOnboarded, validate({ query: clubListQuerySchema }), async (req, res) => {
  res.json({ data: await listClubs(req.valid.query) });
});

clubsRouter.get('/clubs/:slug', requireOnboarded, async (req, res) => {
  res.json({ data: await getClub(String(req.params.slug), req.user!.id) });
});

clubsRouter.put(
  '/clubs/:slug/review',
  requireOnboarded,
  writeLimiter,
  validate({ body: clubReviewSchema }),
  async (req, res) => {
    res.json({ data: await reviewClub(req.user!.id, String(req.params.slug), req.valid.body) });
  },
);
