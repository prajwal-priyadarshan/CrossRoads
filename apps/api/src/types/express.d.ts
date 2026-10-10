import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: 'STUDENT' | 'SENIOR' | 'ALUMNI' | 'ADMIN'; onboarded: boolean; currentYear: number | null };
      valid: { body?: any; query?: any; params?: any };
    }
  }
}
export {};
