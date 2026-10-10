import { Router } from 'express';
import { experienceCreateSchema } from '@crossroads/shared';
import { requireOnboarded } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { writeLimiter } from '../../middleware/rateLimits';
import { createExperience, getExperience } from './experiences.service';

export const experiencesRouter = Router();

experiencesRouter.post(
  '/experiences',
  requireOnboarded,
  writeLimiter,
  validate({ body: experienceCreateSchema }),
  async (req, res) => {
    res.status(201).json({ data: await createExperience(req.user!.id, req.valid.body) });
  },
);

experiencesRouter.get('/experiences/:id', requireOnboarded, async (req, res) => {
  res.json({ data: await getExperience(req.user!.id, String(req.params.id)) });
});
