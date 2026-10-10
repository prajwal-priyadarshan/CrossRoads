import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { peopleRouter } from './modules/people/people.routes';
import { connectionsRouter } from './modules/connections/connections.routes';
import { topicsRouter } from './modules/topics/topics.routes';
import { postsRouter } from './modules/posts/posts.routes';
import { votesRouter } from './modules/votes/votes.routes';

export const routes = Router();
routes.use('/auth', authRouter);
routes.use('/', usersRouter);
routes.use('/', peopleRouter);
routes.use('/', connectionsRouter);
routes.use('/', topicsRouter);
routes.use('/', postsRouter);
routes.use('/', votesRouter);
// later phases: routes.use('/', postsRouter); …
