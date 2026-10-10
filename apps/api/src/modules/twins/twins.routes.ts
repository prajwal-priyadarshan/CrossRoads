import { Router } from 'express';
import { requireOnboarded } from '../../middleware/auth';
import { findTwins } from '../../services/twins';

export const twinsRouter = Router();

twinsRouter.get('/path-twins', requireOnboarded, async (req, res) => {
  res.json({ data: await findTwins(req.user!.id) });
});
