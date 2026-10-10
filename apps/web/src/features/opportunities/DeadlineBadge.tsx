import { differenceInCalendarDays, format } from 'date-fns';
import { CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Colour-coded, but the text always says it too (never colour alone). */
export function DeadlineBadge({ deadline, className }: { deadline: string; className?: string }) {
  const days = differenceInCalendarDays(new Date(deadline), new Date());
  const closed = days < 0;
  const label = closed
    ? 'Closed'
    : days === 0
      ? 'Closes today'
      : days === 1
        ? 'Closes tomorrow'
        : days <= 7
          ? `Closes in ${days} days`
          : `Closes ${format(new Date(deadline), 'd MMM')}`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        closed
          ? 'bg-muted text-muted-foreground line-through'
          : days <= 2
            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
            : days <= 7
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              : 'bg-muted text-muted-foreground',
        className,
      )}
    >
      <CalendarClock className="size-3" />
      {label}
    </span>
  );
}
