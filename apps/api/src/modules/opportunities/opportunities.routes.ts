import { Router } from 'express';
import { opportunityListQuerySchema } from '@bridgeup/shared';
import { requireOnboarded } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as svc from './opportunities.service';

export const opportunitiesRouter = Router();

opportunitiesRouter.get(
  '/opportunities',
  requireOnboarded,
  validate({ query: opportunityListQuerySchema }),
  async (req, res) => {
    res.json({ data: await svc.listOpportunities(req.user!.id, req.valid.query) });
  },
);
