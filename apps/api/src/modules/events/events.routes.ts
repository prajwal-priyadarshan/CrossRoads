import { Router } from 'express';
import { requireOnboarded } from '../../middleware/auth';
import { writeLimiter } from '../../middleware/rateLimits';
import { validate } from '../../middleware/validate';
import { chatIdParamsSchema } from '@crossroads/shared';
import { cancelRsvp, myTickets, rsvpEvent, thisWeek, upcomingEvents } from './events.service';

export const eventsRouter = Router();

eventsRouter.get('/events/week', requireOnboarded, async (req, res) => {
  res.json({ data: await thisWeek(req.user!) });
});

eventsRouter.get('/events', requireOnboarded, async (req, res) => {
  const region = typeof req.query.region === 'string' && req.query.region ? req.query.region : undefined;
  res.json({ data: await upcomingEvents(req.user!.id, region) });
});

eventsRouter.post('/events/:id/rsvp', requireOnboarded, writeLimiter, validate({ params: chatIdParamsSchema }), async (req, res) => {
  res.status(201).json({ data: await rsvpEvent(req.user!, req.valid.params.id) });
});

eventsRouter.delete('/events/:id/rsvp', requireOnboarded, validate({ params: chatIdParamsSchema }), async (req, res) => {
  res.json({ data: await cancelRsvp(req.user!.id, req.valid.params.id) });
});

eventsRouter.get('/me/tickets', requireOnboarded, async (req, res) => {
  res.json({ data: await myTickets(req.user!.id) });
});
