import { Router } from 'express';
import {
  connectionCreateSchema,
  connectionRespondSchema,
  completeSchema,
  followUpsSchema,
  connectionsQuerySchema,
} from '@bridgeup/shared';
import { requireOnboarded } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { writeLimiter } from '../../middleware/rateLimits';
import * as svc from './connections.service';

export const connectionsRouter = Router();
connectionsRouter.use('/connections', requireOnboarded);

connectionsRouter.post('/connections', writeLimiter, validate({ body: connectionCreateSchema }), async (req, res) => {
  res.status(201).json({ data: await svc.createRequest(req.user!.id, req.valid.body) });
});

connectionsRouter.get('/connections', validate({ query: connectionsQuerySchema }), async (req, res) => {
  res.json({ data: await svc.listRequests(req.user!.id, req.valid.query.box) });
});

connectionsRouter.patch('/connections/:id', validate({ body: connectionRespondSchema }), async (req, res) => {
  res.json({ data: await svc.respond(req.user!.id, String(req.params.id), req.valid.body.status) });
});

connectionsRouter.post('/connections/:id/complete', validate({ body: completeSchema }), async (req, res) => {
  res.json({ data: await svc.complete(req.user!.id, String(req.params.id), req.valid.body.sessionNote) });
});

connectionsRouter.put('/connections/:id/follow-ups', validate({ body: followUpsSchema }), async (req, res) => {
  res.json({ data: await svc.updateFollowUps(req.user!.id, String(req.params.id), req.valid.body.followUps) });
});
