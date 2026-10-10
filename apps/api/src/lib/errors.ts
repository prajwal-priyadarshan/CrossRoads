export class AppError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>) {
    super(message);
  }
}
export const badRequest = (m: string, fields?: Record<string, string>) => new AppError(400, 'VALIDATION', m, fields);
export const unauthorized = (m = 'Please sign in') => new AppError(401, 'UNAUTHENTICATED', m);
export const forbidden = (m = 'You do not have access to this') => new AppError(403, 'FORBIDDEN', m);
export const notFound = (m = 'Not found') => new AppError(404, 'NOT_FOUND', m);
export const conflict = (m: string) => new AppError(409, 'CONFLICT', m);
