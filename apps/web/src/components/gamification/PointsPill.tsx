import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PointsPill({ points, className }: { points: number; className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", className)}>
      <Star className="h-3 w-3 fill-current" />
      <span className="tabular-nums">{points}</span>
    </div>
  );
}
