import type { Response } from 'express';
import { env, isProd } from '../config/env';

export function setSessionCookie(res: Response, token: string) {
  res.cookie('bu_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: env.SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
}

export const clearSessionCookie = (res: Response) => res.clearCookie('bu_session', { path: '/' });
