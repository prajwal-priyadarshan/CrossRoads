import type { RequestHandler } from 'express';
import { verifySession } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import { unauthorized, forbidden } from '../lib/errors';

export type SessionUser = {
  id: string;
  role: 'STUDENT' | 'SENIOR' | 'ALUMNI' | 'ADMIN';
  onboarded: boolean;
  currentYear: number | null;
};

export const authOptional: RequestHandler = async (req, _res, next) => {
  const token = req.cookies?.bu_session;
  if (!token) return next();
  const payload = verifySession(token); // null if invalid/expired
  if (!payload) return next();
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, onboarded: true, currentYear: true, emailVerified: true },
  });
  if (user?.emailVerified) {
    req.user = { id: user.id, role: user.role, onboarded: user.onboarded, currentYear: user.currentYear };
  }
  next();
};

export const requireAuth: RequestHandler = (req, _res, next) => (req.user ? next() : next(unauthorized()));

export const requireOnboarded: RequestHandler = (req, _res, next) =>
  !req.user ? next(unauthorized()) : req.user.onboarded ? next() : next(forbidden('Please finish onboarding first'));

export const requireRole =
  (...roles: SessionUser['role'][]): RequestHandler =>
  (req, _res, next) =>
    !req.user ? next(unauthorized()) : roles.includes(req.user.role) ? next() : next(forbidden());
