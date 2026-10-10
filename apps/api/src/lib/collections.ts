export function groupBy<T>(items: T[], key: (item: T) => string) {
  const out: Record<string, T[]> = {};
  for (const item of items) (out[key(item)] ??= []).push(item);
  return out;
}

export const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
export const round1 = (x: number) => Math.round(x * 10) / 10;
