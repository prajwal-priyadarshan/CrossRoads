import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  reportResolveSchema, adminUserUpdateSchema, allowlistSchema,
  eventUpsertSchema, companyUpsertSchema, clubUpsertSchema, storyUpsertSchema
} from '@crossroads/shared';
import { prisma } from '../../lib/prisma';
import * as service from './admin.service';
import { institutionAnalytics, createOfficialPost } from './analytics';
import { officialPostSchema } from '@crossroads/shared';

export const adminRouter = Router();

// Secure all admin routes
adminRouter.use(requireAuth, requireRole('ADMIN'));

// Institution overview and official posts (phase 12)
adminRouter.get('/analytics', async (_req, res, next) => {
  try { res.json({ data: await institutionAnalytics() }); } catch (err) { next(err); }
});
adminRouter.post('/official-posts', validate({ body: officialPostSchema }), async (req, res, next) => {
  try { res.status(201).json({ data: await createOfficialPost(req.user!.id, req.valid.body) }); } catch (err) { next(err); }
});

// Reports
adminRouter.get('/reports', async (req, res, next) => {
  try {
    const viewer = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id }, select: { isSafeguardingCoordinator: true } });
    res.json({ data: await service.adminGetReports(viewer, req.query.status as string) });
  } catch (err) { next(err); }
});
adminRouter.patch('/reports/:id', validate({ body: reportResolveSchema }), async (req, res, next) => {
  try {
    const viewer = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id }, select: { isSafeguardingCoordinator: true } });
    res.json({ data: await service.adminResolveReport(viewer, req.params.id as string, req.valid.body.action) });
  } catch (err) { next(err); }
});

// Users
adminRouter.get('/users', async (req, res, next) => {
  try { res.json({ data: await service.adminGetUsers(req.query.q as string, req.query.role as string) }); } catch (err) { next(err); }
});
adminRouter.patch('/users/:id', validate({ body: adminUserUpdateSchema }), async (req, res, next) => {
  try { res.json({ data: await service.adminUpdateUser(req.params.id as string, req.valid.body) }); } catch (err) { next(err); }
});
adminRouter.post('/allowlist', validate({ body: allowlistSchema }), async (req, res, next) => {
  try { res.json({ data: await service.adminAllowlistEmail(req.valid.body.email, req.valid.body.role) }); } catch (err) { next(err); }
});

// Events
adminRouter.get('/events', async (req, res, next) => {
  try { res.json({ data: await service.adminGetEvents() }); } catch (err) { next(err); }
});
adminRouter.post('/events', validate({ body: eventUpsertSchema }), async (req, res, next) => {
  try { res.json({ data: await service.adminUpsertEvent(null, req.valid.body) }); } catch (err) { next(err); }
});
adminRouter.patch('/events/:id', validate({ body: eventUpsertSchema }), async (req, res, next) => {
  try { res.json({ data: await service.adminUpsertEvent(req.params.id as string, req.valid.body) }); } catch (err) { next(err); }
});
adminRouter.delete('/events/:id', async (req, res, next) => {
  try { res.json({ data: await service.adminDeleteEvent(req.params.id as string) }); } catch (err) { next(err); }
});

// Companies
adminRouter.get('/companies', async (req, res, next) => {
  try { res.json({ data: await service.adminGetCompanies() }); } catch (err) { next(err); }
});
adminRouter.post('/companies', validate({ body: companyUpsertSchema }), async (req, res, next) => {
  try { res.json({ data: await service.adminUpsertCompany(null, req.valid.body) }); } catch (err) { next(err); }
});
adminRouter.patch('/companies/:id', validate({ body: companyUpsertSchema }), async (req, res, next) => {
  try { res.json({ data: await service.adminUpsertCompany(req.params.id as string, req.valid.body) }); } catch (err) { next(err); }
});

// Clubs
adminRouter.get('/clubs', async (req, res, next) => {
  try { res.json({ data: await service.adminGetClubs() }); } catch (err) { next(err); }
});
adminRouter.post('/clubs', validate({ body: clubUpsertSchema }), async (req, res, next) => {
  try { res.json({ data: await service.adminUpsertClub(null, req.valid.body) }); } catch (err) { next(err); }
});
adminRouter.patch('/clubs/:id', validate({ body: clubUpsertSchema }), async (req, res, next) => {
  try { res.json({ data: await service.adminUpsertClub(req.params.id as string, req.valid.body) }); } catch (err) { next(err); }
});

// Stories
adminRouter.get('/stories', async (req, res, next) => {
  try { res.json({ data: await service.adminGetStories() }); } catch (err) { next(err); }
});
adminRouter.post('/stories', validate({ body: storyUpsertSchema }), async (req, res, next) => {
  try { res.json({ data: await service.adminUpsertStory(null, req.valid.body) }); } catch (err) { next(err); }
});
adminRouter.patch('/stories/:id', validate({ body: storyUpsertSchema }), async (req, res, next) => {
  try { res.json({ data: await service.adminUpsertStory(req.params.id as string, req.valid.body) }); } catch (err) { next(err); }
});

// Experiences
adminRouter.get('/experiences', async (req, res, next) => {
  try { res.json({ data: await service.adminGetExperiences() }); } catch (err) { next(err); }
});
adminRouter.patch('/experiences/:id', async (req, res, next) => {
  try { res.json({ data: await service.adminVerifyExperience(req.params.id!, req.body.isVerified) }); } catch (err) { next(err); }
});
