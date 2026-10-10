import { Router } from 'express';
import { requireOnboarded } from '../../middleware/auth';
import * as svc from './topics.service';

export const topicsRouter = Router();

topicsRouter.get('/topics', requireOnboarded, async (req, res) => {
  res.json({ data: await svc.listTopics(req.user!.id) });
});

topicsRouter.post('/topics/:id/follow', requireOnboarded, async (req, res) => {
  await svc.follow(req.user!.id, Number(req.params.id));
  res.json({ data: { ok: true } });
});

topicsRouter.delete('/topics/:id/follow', requireOnboarded, async (req, res) => {
  await svc.unfollow(req.user!.id, Number(req.params.id));
  res.json({ data: { ok: true } });
});
