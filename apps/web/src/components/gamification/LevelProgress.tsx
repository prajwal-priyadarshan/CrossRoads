import { Progress } from '@/components/ui/progress';
import { levelFor } from '@crossroads/shared';

export function LevelProgress({ points }: { points: number }) {
  const level = levelFor(points);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{level.name}</span>
        <span className="text-muted-foreground text-xs">
          {level.next ? `${points} / ${level.next} to next` : 'Legend — thank you for everything you do'}
        </span>
      </div>
      {level.next && <Progress value={level.progress * 100} className="h-2 bg-amber-100 dark:bg-amber-950 [&>div]:bg-amber-500" />}
    </div>
  );
}
