import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';
import { env } from './config/env';
import { logger } from './lib/logger';
import { authOptional } from './middleware/auth';
import { jsonOnly } from './middleware/jsonOnly';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { routes } from './routes';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // behind Render/Vercel proxies: correct IPs for rate limits, secure cookies
  app.use(helmet());
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger, genReqId: (req) => (req.headers['x-request-id'] as string) ?? randomUUID() }));
  app.use(authOptional);
  app.use(jsonOnly);

  app.get('/api/health', (_req, res) => res.json({ data: { ok: true, time: new Date().toISOString() } }));

  app.use('/api', routes);

  app.use('/api', notFoundHandler);
  app.use(errorHandler);
  return app;
}
