import { Router } from 'express';
import { searchQuerySchema } from '@bridgeup/shared';
import { requireOnboarded } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { search } from './search.service';

export const searchRouter = Router();

searchRouter.get('/search', requireOnboarded, validate({ query: searchQuerySchema }), async (req, res) => {
  res.json({ data: await search(req.valid.query) });
});
