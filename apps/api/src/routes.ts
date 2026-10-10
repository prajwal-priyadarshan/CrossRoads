import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';

export const routes = Router();
routes.use('/auth', authRouter);
routes.use('/', usersRouter);
// later phases: routes.use('/', peopleRouter); …
