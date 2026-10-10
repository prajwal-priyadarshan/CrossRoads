import pino from 'pino';
import { env, isProd } from '../config/env';

export const logger = pino({
  level: env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  // Never write session cookies or auth headers to logs
  redact: {
    paths: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]', '*.password', '*.passwordHash'],
    censor: '[redacted]',
  },
  transport: isProd ? undefined : { target: 'pino-pretty', options: { colorize: true } },
});
