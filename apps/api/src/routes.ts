import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { peopleRouter } from './modules/people/people.routes';
import { connectionsRouter } from './modules/connections/connections.routes';

export const routes = Router();
routes.use('/auth', authRouter);
routes.use('/', usersRouter);
routes.use('/', peopleRouter);
routes.use('/', connectionsRouter);
// later phases: routes.use('/', postsRouter); …
