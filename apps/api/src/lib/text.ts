export const normalizeTag = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

export const titleCase = (s = '') =>
  s.replace(/\b\w/g, (m) => m.toUpperCase()).replace(/\bAi\b/g, 'AI').replace(/\bMl\b/g, 'ML').replace(/\bDsa\b/g, 'DSA');

export function jaccard(a: string[], b: string[]) {
  if (!a.length && !b.length) return 0;
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / new Set([...A, ...B]).size;
}

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
