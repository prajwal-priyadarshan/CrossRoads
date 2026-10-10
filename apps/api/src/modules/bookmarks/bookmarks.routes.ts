import { Router } from 'express';
import { bookmarkSchema, bookmarksQuerySchema } from '@crossroads/shared';
import { requireOnboarded } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { writeLimiter } from '../../middleware/rateLimits';
import { listBookmarks, toggleBookmark } from './bookmarks.service';

export const bookmarksRouter = Router();

bookmarksRouter.put('/bookmarks', requireOnboarded, writeLimiter, validate({ body: bookmarkSchema }), async (req, res) => {
  res.json({ data: await toggleBookmark(req.user!.id, req.valid.body) });
});

bookmarksRouter.get('/bookmarks', requireOnboarded, validate({ query: bookmarksQuerySchema }), async (req, res) => {
  res.json({ data: await listBookmarks(req.user!.id, req.valid.query.type) });
});
