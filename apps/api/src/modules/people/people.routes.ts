import { Router } from 'express';
import { peopleQuerySchema, aiPeopleSearchSchema } from '@crossroads/shared';
import { requireOnboarded } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { aiLimiter } from '../../middleware/rateLimits';
import { discoverPeople, suggestedPeople, aiDiscoverPeople } from './people.service';

export const peopleRouter = Router();

// Declared before any "/people/:param" route so "suggested" is not captured as a param.
peopleRouter.get('/people/suggested', requireOnboarded, async (req, res) => {
  res.json({ data: await suggestedPeople(req.user!.id) });
});

peopleRouter.post(
  '/people/search/ai',
  requireOnboarded,
  aiLimiter,
  validate({ body: aiPeopleSearchSchema }),
  async (req, res) => {
    res.json({ data: await aiDiscoverPeople(req.user!.id, req.valid.body.query) });
  },
);

peopleRouter.get('/people', requireOnboarded, validate({ query: peopleQuerySchema }), async (req, res) => {
  res.json({ data: await discoverPeople(req.user!.id, req.valid.query) });
});
