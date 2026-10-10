import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';
import { docsEnabled, env } from './config/env';
import { logger } from './lib/logger';
import { authOptional } from './middleware/auth';
import { jsonOnly } from './middleware/jsonOnly';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { docsRouter } from './docs/docs.routes';
import { routes } from './routes';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // behind Render/Vercel proxies: correct IPs for rate limits, secure cookies

  // API docs are mounted before the global helmet so they can use their own CSP
  if (docsEnabled) app.use('/api', docsRouter());

  app.use(helmet());
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req.headers['x-request-id'] as string) ?? randomUUID(),
      autoLogging: { ignore: (req) => req.url === '/api/health' },
    }),
  );
  app.use(authOptional);
  app.use(jsonOnly);

  app.use('/api', routes);

  app.use('/api', notFoundHandler);
  app.use(errorHandler);
  return app;
}
