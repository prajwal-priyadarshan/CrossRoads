import { Router } from 'express';
import { assistantAskSchema } from '@crossroads/shared';
import { requireOnboarded } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { aiLimiter } from '../../middleware/rateLimits';
import { askAssistant } from './assistant.service';

export const assistantRouter = Router();

assistantRouter.post(
  '/assistant/ask',
  requireOnboarded,
  aiLimiter,
  validate({ body: assistantAskSchema }),
  async (req, res) => {
    const { message, history } = req.valid.body;
    res.json({ data: await askAssistant(req.user!.id, message, history) });
  },
);
