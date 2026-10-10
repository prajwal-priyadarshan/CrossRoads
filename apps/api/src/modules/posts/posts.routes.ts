import { Router } from 'express';
import { z } from 'zod';
import { bestAnswerSchema, commentCreateSchema, postCreateSchema, postListQuerySchema } from '@crossroads/shared';
import { requireOnboarded } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { writeLimiter } from '../../middleware/rateLimits';
import * as svc from './posts.service';

export const postsRouter = Router();

postsRouter.get('/posts', requireOnboarded, validate({ query: postListQuerySchema }), async (req, res) => {
  res.json({ data: await svc.listPosts(req.user!.id, req.valid.query) });
});

postsRouter.post('/posts', requireOnboarded, writeLimiter, validate({ body: postCreateSchema }), async (req, res) => {
  res.status(201).json({ data: await svc.createPost(req.user!.id, req.valid.body) });
});

postsRouter.get('/posts/:id', requireOnboarded, async (req, res) => {
  res.json({ data: await svc.getPost(req.user!.id, String(req.params.id)) });
});

postsRouter.delete('/posts/:id', requireOnboarded, async (req, res) => {
  await svc.deletePost(req.user!, String(req.params.id));
  res.json({ data: { ok: true } });
});

postsRouter.post(
  '/posts/:id/comments',
  requireOnboarded,
  writeLimiter,
  validate({ body: commentCreateSchema }),
  async (req, res) => {
    res.status(201).json({ data: await svc.createComment(req.user!.id, String(req.params.id), req.valid.body) });
  },
);

postsRouter.post('/posts/:id/best-answer', requireOnboarded, validate({ body: bestAnswerSchema }), async (req, res) => {
  await svc.markBestAnswer(req.user!.id, String(req.params.id), req.valid.body.commentId);
  res.json({ data: { ok: true } });
});

postsRouter.get(
  '/questions/similar',
  requireOnboarded,
  validate({ query: z.object({ q: z.string().trim().max(200).default('') }) }),
  async (req, res) => {
    res.json({ data: await svc.similarQuestions(req.valid.query.q) });
  },
);
