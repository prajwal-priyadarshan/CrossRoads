import { Router } from 'express';
import { requireOnboarded } from '../../middleware/auth';
import { thisWeek } from './events.service';

export const eventsRouter = Router();

eventsRouter.get('/events/week', requireOnboarded, async (req, res) => {
  res.json({ data: await thisWeek(req.user!) });
});
