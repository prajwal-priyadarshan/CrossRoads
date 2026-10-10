import { Router } from 'express';
import { onboardingSchema } from '@bridgeup/shared';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { completeOnboarding, toMe } from './users.service';

export const usersRouter = Router();

usersRouter.patch('/me/onboarding', requireAuth, validate({ body: onboardingSchema }), async (req, res) => {
  const user = await completeOnboarding(req.user!.id, req.valid.body);
  res.json({ data: toMe(user) });
});
