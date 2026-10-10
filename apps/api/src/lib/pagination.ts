export const encodeCursor = (createdAt: Date, id: string) =>
  Buffer.from(`${createdAt.toISOString()}|${id}`).toString('base64url');

export function decodeCursor(c?: string) {
  if (!c) return null;
  const [iso, id] = Buffer.from(c, 'base64url').toString().split('|');
  const createdAt = iso ? new Date(iso) : null;
  return createdAt && !Number.isNaN(+createdAt) && id ? { createdAt, id } : null;
}
