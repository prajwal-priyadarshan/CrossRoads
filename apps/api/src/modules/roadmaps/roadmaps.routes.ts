import { Router } from 'express';
import { roadmapCreateSchema, roadmapListQuerySchema, roadmapStepToggleSchema, roadmapGenerateSchema } from '@crossroads/shared';
import { requireOnboarded } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { writeLimiter, aiLimiter } from '../../middleware/rateLimits';
import * as svc from './roadmaps.service';

export const roadmapsRouter = Router();

roadmapsRouter.get('/roadmaps', requireOnboarded, validate({ query: roadmapListQuerySchema }), async (req, res) => {
  res.json({ data: await svc.listRoadmaps(req.user!.id, req.valid.query) });
});

roadmapsRouter.post('/roadmaps/generate', requireOnboarded, aiLimiter, validate({ body: roadmapGenerateSchema }), async (req, res) => {
  res.status(201).json({ data: await svc.generateRoadmap(req.user!.id, req.valid.body) });
});

roadmapsRouter.get('/roadmaps/:id', requireOnboarded, async (req, res) => {
  res.json({ data: await svc.getRoadmap(req.user!.id, String(req.params.id)) });
});

roadmapsRouter.post('/roadmaps', requireOnboarded, writeLimiter, validate({ body: roadmapCreateSchema }), async (req, res) => {
  res.status(201).json({ data: await svc.createRoadmap(req.user!.id, req.valid.body) });
});

roadmapsRouter.put('/roadmaps/:id/save', requireOnboarded, async (req, res) => {
  res.json({ data: await svc.toggleSave(req.user!.id, String(req.params.id)) });
});

roadmapsRouter.patch(
  '/roadmaps/:id/steps/:stepId',
  requireOnboarded,
  validate({ body: roadmapStepToggleSchema }),
  async (req, res) => {
    res.json({
      data: await svc.toggleStep(req.user!.id, String(req.params.id), String(req.params.stepId), req.valid.body.done),
    });
  },
);
