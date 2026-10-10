import { Router } from 'express';
import { requireAuth } from '../../lib/auth';
import { validate } from '../../lib/middleware';
import { writeLimiter } from '../../lib/rateLimit';
import { reportCreateSchema } from '@bridgeup/shared';
import { createReport } from './reports.service';

export const reportsRouter = Router();

reportsRouter.post('/reports', requireAuth, writeLimiter, validate({ body: reportCreateSchema }), async (req, res, next) => {
  try {
    const report = await createReport(req.viewer!.id, req.valid.body);
    res.json({ data: report });
  } catch (err) {
    next(err);
  }
});
