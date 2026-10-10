import { Router } from 'express';
import { peopleQuerySchema } from '@bridgeup/shared';
import { requireOnboarded } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { discoverPeople, suggestedPeople } from './people.service';

export const peopleRouter = Router();

// Declared before any "/people/:param" route so "suggested" is not captured as a param.
peopleRouter.get('/people/suggested', requireOnboarded, async (req, res) => {
  res.json({ data: await suggestedPeople(req.user!.id) });
});

peopleRouter.get('/people', requireOnboarded, validate({ query: peopleQuerySchema }), async (req, res) => {
  res.json({ data: await discoverPeople(req.user!.id, req.valid.query) });
});
