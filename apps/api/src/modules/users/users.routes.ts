import { Router } from 'express';
import { onboardingSchema, profileUpdateSchema, milestoneSchema, deleteAccountSchema } from '@crossroads/shared';
import { clearSessionCookie } from '../../lib/cookies';
import { deleteMyAccount, exportMyData } from './account.service';
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

// Your data (phase 12): a full export, and account deletion after confirming the password
usersRouter.get('/me/export', requireAuth, async (req, res) => {
  const data = await exportMyData(req.user!.id);
  res.set('Content-Disposition', 'attachment; filename="crossroads-my-data.json"').json({ data });
});

usersRouter.delete('/me', requireAuth, validate({ body: deleteAccountSchema }), async (req, res) => {
  await deleteMyAccount(req.user!.id, req.valid.body.password);
  clearSessionCookie(res);
  res.json({ data: { ok: true } });
});
