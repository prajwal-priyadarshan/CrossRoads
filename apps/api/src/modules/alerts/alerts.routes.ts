import { Router } from 'express';
import { alertPrefsSchema } from '@crossroads/shared';
import { requireOnboarded } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { writeLimiter } from '../../middleware/rateLimits';
import * as svc from './alerts.service';

export const alertsRouter = Router();
alertsRouter.use('/me/alerts', requireOnboarded);

alertsRouter.get('/me/alerts', async (req, res) => {
  res.json({ data: await svc.getAlertPrefs(req.user!.id) });
});

alertsRouter.put('/me/alerts', writeLimiter, validate({ body: alertPrefsSchema }), async (req, res) => {
  res.json({ data: await svc.updateAlertPrefs(req.user!.id, req.valid.body) });
});
