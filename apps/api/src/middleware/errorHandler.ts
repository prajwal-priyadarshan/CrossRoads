import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../lib/errors';
import { Prisma } from '../generated/prisma/client';
import { isProd } from '../config/env';

export const notFoundHandler: RequestHandler = (_req, res) =>
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, fields: err.fields } });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return res.status(409).json({ error: { code: 'CONFLICT', message: 'This already exists' } });
  }
  req.log?.error({ err }, 'Unhandled error');
  res.status(500).json({ error: { code: 'INTERNAL', message: isProd ? 'Something went wrong' : String(err?.message ?? err) } });
};
