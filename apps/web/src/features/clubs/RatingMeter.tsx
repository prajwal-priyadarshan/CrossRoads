import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/** Label + value + 5-segment bar filled proportionally. Usefulness is emerald, time cost amber. */
export function RatingMeter({
  label,
  value,
  tone,
  size = 'sm',
}: {
  label: string;
  value: number | null;
  tone: 'useful' | 'time';
  size?: 'sm' | 'lg';
}) {
  const fill = tone === 'useful' ? 'bg-emerald-500' : 'bg-amber-500';
  const help = tone === 'useful' ? 'Usefulness: 1 = not useful, 5 = very useful' : 'Time cost: 1 = light, 5 = very demanding';
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="space-y-1">
          <div className={cn('flex items-center justify-between', size === 'lg' ? 'text-sm' : 'text-xs')}>
            <span className="text-muted-foreground">{label}</span>
            <span className="tabular font-semibold">{value === null ? 'No reviews yet' : value.toFixed(1)}</span>
          </div>
          <div className={cn('flex gap-1', size === 'lg' ? 'h-2.5' : 'h-1.5')} aria-hidden>
            {[1, 2, 3, 4, 5].map((i) => {
              const pct = value === null ? 0 : Math.max(0, Math.min(1, value - (i - 1))) * 100;
              return (
                <span key={i} className="relative flex-1 overflow-hidden rounded-full bg-muted">
                  <span className={cn('absolute inset-y-0 left-0', fill)} style={{ width: `${pct}%` }} />
                </span>
              );
            })}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>{help}</TooltipContent>
    </Tooltip>
  );
}
