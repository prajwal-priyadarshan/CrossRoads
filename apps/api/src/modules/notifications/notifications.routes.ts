import { Router } from 'express';
import { markReadSchema, notificationListQuerySchema } from '@crossroads/shared';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as svc from './notifications.service';

export const notificationsRouter = Router();
notificationsRouter.use('/notifications', requireAuth);

notificationsRouter.get('/notifications', validate({ query: notificationListQuerySchema }), async (req, res) => {
  res.json({ data: await svc.listNotifications(req.user!.id, req.valid.query) });
});

// Declared before /notifications/:id-style routes would be; polled by the bell
notificationsRouter.get('/notifications/unread-count', async (req, res) => {
  res.json({ data: await svc.unreadCount(req.user!.id) });
});

notificationsRouter.post('/notifications/read', validate({ body: markReadSchema }), async (req, res) => {
  res.json({ data: await svc.markRead(req.user!.id, req.valid.body) });
});
