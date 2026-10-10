import { Router } from 'express';
import { donateSchema } from '@crossroads/shared';
import { requireOnboarded } from '../../middleware/auth';
import { writeLimiter } from '../../middleware/rateLimits';
import { validate } from '../../middleware/validate';
import * as giving from './giving.service';

export const givingRouter = Router();

givingRouter.get('/giving/campaigns', requireOnboarded, async (_req, res) => {
  res.json({ data: await giving.listCampaigns() });
});

givingRouter.get('/giving/campaigns/:slug', requireOnboarded, async (req, res) => {
  res.json({ data: await giving.getCampaign(req.params.slug as string) });
});

givingRouter.post(
  '/giving/campaigns/:slug/donate',
  requireOnboarded,
  writeLimiter,
  validate({ body: donateSchema }),
  async (req, res) => {
    res.status(201).json({ data: await giving.donate(req.user!.id, req.params.slug as string, req.valid.body) });
  },
);
