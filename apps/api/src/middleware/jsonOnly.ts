import type { RequestHandler } from 'express';

// CSRF hardening: state-changing requests must be JSON, which cross-site forms cannot send.
export const jsonOnly: RequestHandler = (req, res, next) => {
  const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  if (isWrite && req.headers['content-length'] !== '0' && !req.is('application/json')) {
    return res.status(415).json({ error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Send JSON' } });
  }
  next();
};
