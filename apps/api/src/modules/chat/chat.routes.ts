import { Router } from 'express';
import {
  chatIdParamsSchema,
  chatMessagesQuerySchema,
  chatSendSchema,
  chatStartSchema,
} from '@crossroads/shared';
import { requireOnboarded } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { writeLimiter } from '../../middleware/rateLimits';
import * as chat from './chat.service';

export const chatRouter = Router();

chatRouter.get('/chat/conversations', requireOnboarded, async (req, res) => {
  res.json({ data: await chat.listConversations(req.user!) });
});

chatRouter.post('/chat/conversations', requireOnboarded, writeLimiter, validate({ body: chatStartSchema }), async (req, res) => {
  res.status(201).json({ data: await chat.startConversation(req.user!, req.valid.body.userId) });
});

chatRouter.get(
  '/chat/conversations/:id/messages',
  requireOnboarded,
  validate({ params: chatIdParamsSchema, query: chatMessagesQuerySchema }),
  async (req, res) => {
    res.json({ data: await chat.listMessages(req.user!, req.valid.params.id, req.valid.query.cursor) });
  },
);

chatRouter.post(
  '/chat/conversations/:id/messages',
  requireOnboarded,
  writeLimiter,
  validate({ params: chatIdParamsSchema, body: chatSendSchema }),
  async (req, res) => {
    res.status(201).json({ data: await chat.sendMessage(req.user!, req.valid.params.id, req.valid.body) });
  },
);

chatRouter.post('/chat/conversations/:id/read', requireOnboarded, validate({ params: chatIdParamsSchema }), async (req, res) => {
  res.json({ data: await chat.markRead(req.user!, req.valid.params.id) });
});
