import { Router } from 'express';
import { requireAuth } from '../../lib/auth';
import { mentorWall, getContributions } from '../users/users.service';

export const gamificationRouter = Router();

gamificationRouter.get('/mentor-wall', requireAuth, async (req, res, next) => {
  try {
    const wall = await mentorWall();
    res.json({ data: wall });
  } catch (err) {
    next(err);
  }
});

gamificationRouter.get('/users/:handle/contributions', requireAuth, async (req, res, next) => {
  try {
    const data = await getContributions(req.params.handle!);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});
