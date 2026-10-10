import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { writeLimiter } from '../../middleware/rateLimits';
import { reportCreateSchema } from '@crossroads/shared';
import { createReport } from './reports.service';

export const reportsRouter = Router();

reportsRouter.post('/reports', requireAuth, writeLimiter, validate({ body: reportCreateSchema }), async (req, res, next) => {
  try {
    const report = await createReport(req.user!.id, req.valid.body);
    res.json({ data: report });
  } catch (err) {
    next(err);
  }
});
