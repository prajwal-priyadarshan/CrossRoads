import { Router } from 'express';
import { listStories, getStory } from './stories.service';

export const storiesRouter = Router();

storiesRouter.get('/stories', async (req, res, next) => {
  try {
    const data = await listStories({ tag: req.query.tag as string, cursor: req.query.cursor as string });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

storiesRouter.get('/stories/:slug', async (req, res, next) => {
  try {
    const data = await getStory(req.params.slug!);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});
