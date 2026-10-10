import { Router } from 'express';
import { onboardingSchema, profileUpdateSchema, milestoneSchema } from '@crossroads/shared';
import { requireAuth, requireOnboarded } from '../../middleware/auth';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';
import { validate } from '../../middleware/validate';
import { completeOnboarding, getPublicProfile, toMe, updateProfile } from './users.service';

export const usersRouter = Router();

usersRouter.patch('/me/onboarding', requireAuth, validate({ body: onboardingSchema }), async (req, res) => {
  const user = await completeOnboarding(req.user!.id, req.valid.body);
  res.json({ data: toMe(user) });
});

usersRouter.patch('/me/profile', requireOnboarded, validate({ body: profileUpdateSchema }), async (req, res) => {
  res.json({ data: toMe(await updateProfile(req.user!.id, req.valid.body)) });
});

usersRouter.get('/users/:handle', requireOnboarded, async (req, res) => {
  res.json({ data: await getPublicProfile(String(req.params.handle), req.user!) });
});

usersRouter.post('/me/milestones', requireOnboarded, validate({ body: milestoneSchema }), async (req, res) => {
  const m = await prisma.milestone.create({ data: { ...req.valid.body, userId: req.user!.id } });
  res.status(201).json({ data: m });
});

usersRouter.delete('/me/milestones/:id', requireOnboarded, async (req, res) => {
  const r = await prisma.milestone.deleteMany({ where: { id: String(req.params.id), userId: req.user!.id } }); // owner-only
  if (!r.count) throw notFound();
  res.json({ data: { ok: true } });
});
