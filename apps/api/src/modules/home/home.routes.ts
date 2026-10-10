import { Router } from 'express';
import { railQuerySchema } from '@bridgeup/shared';
import { requireOnboarded } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { getRail } from './home.service';

export const homeRouter = Router();

homeRouter.get('/home/rail', requireOnboarded, validate({ query: railQuerySchema }), async (req, res) => {
  res.json({ data: await getRail(req.user!, req.valid.query.visitedClubs) });
});
