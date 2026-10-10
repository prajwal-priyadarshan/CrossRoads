import { Link } from 'react-router';
import { differenceInCalendarDays, format, formatDistanceToNowStrict } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import type { WeekEvent } from '@bridgeup/shared';
import { cn } from '@/lib/utils';
import { RailCard } from './RailCard';

const DOT: Record<string, string> = {
  CLUB: 'bg-amber-500',
  EXAM: 'bg-rose-500',
  HACKATHON: 'bg-indigo-500',
  PLACEMENT: 'bg-emerald-500',
  DEADLINE: 'bg-orange-500',
  EVENT: 'bg-sky-500',
  WEBINAR: 'bg-violet-500',
  REUNION: 'bg-pink-500',
  CHAPTER_MEET: 'bg-teal-500',
};

function dayLabel(d: Date) {
  const diff = differenceInCalendarDays(d, new Date());
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return format(d, 'EEE d MMM');
}

export function ThisWeek({ events }: { events: WeekEvent[] }) {
  const groups = new Map<string, WeekEvent[]>();
  for (const e of events) {
    const k = dayLabel(new Date(e.startsAt));
    groups.set(k, [...(groups.get(k) ?? []), e]);
  }
  return (
    <RailCard title="This week">
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          A quiet week.{' '}
          <Link to="/clubs" className="text-primary hover:underline">
            Explore clubs?
          </Link>
        </p>
      ) : (
        <div className="space-y-3">
          {[...groups.entries()].map(([day, items]) => (
            <div key={day}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{day}</p>
              <ul className="space-y-2">
                {items.map((e) => {
                  const start = new Date(e.startsAt);
                  return (
                    <li key={e.id} className="flex items-start gap-2.5">
                      <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', DOT[e.category] ?? 'bg-muted-foreground')} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug">{e.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(start, 'h:mm a')} · {formatDistanceToNowStrict(start, { addSuffix: true })}
                        </p>
                      </div>
                      {e.link && (
                        <a href={e.link} target="_blank" rel="noopener noreferrer" aria-label={`Open ${e.title}`}>
                          <ExternalLink className="size-3.5 text-muted-foreground hover:text-foreground" />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </RailCard>
  );
}
