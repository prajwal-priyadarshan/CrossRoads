import { LEVELS } from './constants';

export function levelFor(points: number) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (points >= LEVELS[i]!.min) idx = i;
  const current = LEVELS[idx]!;
  const next = LEVELS[idx + 1] ?? null;
  const progress = next ? (points - current.min) / (next.min - current.min) : 1;
  return { name: current.name, min: current.min, next: next?.min ?? null, progress };
}
