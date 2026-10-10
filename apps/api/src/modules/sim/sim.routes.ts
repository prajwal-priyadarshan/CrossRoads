import { Router } from 'express';
import { requireOnboarded } from '../../middleware/auth';
import { start } from './sim.service';
import { validate } from '../../middleware/validate';
import { simStartSchema } from '@bridgeup/shared';

export const simRouter = Router();

simRouter.post('/sessions', requireOnboarded, validate({ body: simStartSchema }), async (req, res) => {
  res.json({ data: await start(req.user!.id, req.valid.body) });
});
