import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { badRequest } from '../lib/errors';

type Schemas = { body?: ZodTypeAny; query?: ZodTypeAny; params?: ZodTypeAny };

export const validate =
  (s: Schemas): RequestHandler =>
  (req, _res, next) => {
    const out: Record<string, unknown> = {};
    for (const key of ['body', 'query', 'params'] as const) {
      const schema = s[key];
      if (!schema) continue;
      const result = schema.safeParse(req[key]);
      if (!result.success) {
        const fields: Record<string, string> = {};
        for (const issue of result.error.issues) fields[issue.path.join('.') || key] ??= issue.message;
        return next(badRequest('Please check the highlighted fields', fields));
      }
      out[key] = result.data;
    }
    // Express 5 makes req.query a getter; store parsed values separately instead of reassigning.
    req.valid = out;
    next();
  };
