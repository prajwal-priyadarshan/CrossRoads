import { Router } from 'express';
import { guideQuestionSchema } from '@crossroads/shared';
import { requireAuth } from '../../middleware/auth';
import { aiLimiter } from '../../middleware/rateLimits';
import { validate } from '../../middleware/validate';
import { askGuide } from './guide.service';

export const guideRouter = Router();

guideRouter.post('/guide/ask', requireAuth, aiLimiter, validate({ body: guideQuestionSchema }), async (req, res) => {
  res.json({ data: await askGuide(req.valid.body.question) });
});
