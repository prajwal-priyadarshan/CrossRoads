import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../lib/errors';
import { Prisma } from '../generated/prisma/client';
import { isProd } from '../config/env';

export const notFoundHandler: RequestHandler = (_req, res) =>
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });

const send = (res: Parameters<ErrorRequestHandler>[2], status: number, code: string, message: string, fields?: unknown) =>
  res.status(status).json({ error: { code, message, ...(fields ? { fields } : {}) } });

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) return send(res, err.status, err.code, err.message, err.fields);

  // body-parser errors: malformed JSON and oversized bodies are client errors, not 500s
  if (err?.type === 'entity.parse.failed') return send(res, 400, 'VALIDATION', 'Request body is not valid JSON');
  if (err?.type === 'entity.too.large') return send(res, 413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return send(res, 409, 'CONFLICT', 'This already exists');
    if (err.code === 'P2025') return send(res, 404, 'NOT_FOUND', 'Not found');
  }

  req.log?.error({ err }, 'Unhandled error');
  return send(res, 500, 'INTERNAL', isProd ? 'Something went wrong' : String(err?.message ?? err));
};
