import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell } from 'lucide-react';
import { isToday, isThisWeek } from 'date-fns';
import { NOTIFICATION_GROUPS, type NotificationItem } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ListSkeleton } from '@/components/shared/Skeletons';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { cn } from '@/lib/utils';
import { useMarkRead, useNotifications } from './api';

type Group = keyof typeof NOTIFICATION_GROUPS;
const CHIPS: { value: Group | ''; label: string }[] = [
  { value: '', label: 'All' },
  ...Object.entries(NOTIFICATION_GROUPS).map(([value, g]) => ({ value: value as Group, label: g.label })),
];

function section(items: NotificationItem[], predicate: (iso: string) => boolean) {
  return items.filter((n) => predicate(n.createdAt));
}

export function NotificationsPage() {
  const [group, setGroup] = useState<Group | ''>('');
  const navigate = useNavigate();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotifications({ group: group || undefined });
  const markRead = useMarkRead();
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  const sections: [string, NotificationItem[]][] = [
    ['Today', section(items, (iso) => isToday(new Date(iso)))],
    ['This week', section(items, (iso) => isThisWeek(new Date(iso)) && !isToday(new Date(iso)))],
    ['Earlier', section(items, (iso) => !isThisWeek(new Date(iso)))],
  ];

  const openItem = (n: NotificationItem) => {
    if (!n.isRead) markRead.mutate({ ids: [n.id] });
    if (n.link) navigate(n.link);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        actions={
          <Button variant="outline" size="sm" onClick={() => markRead.mutate({ all: true })}>
            Mark all as read
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c.value || 'all'}
            type="button"
            aria-pressed={group === c.value}
            onClick={() => setGroup(c.value)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition',
              group === c.value ? 'border-transparent bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <ListSkeleton rows={5} />
      ) : !items.length ? (
        <EmptyState icon={Bell} title="You're all caught up ✨" />
      ) : (
        <div className="space-y-6">
          {sections.map(
            ([label, rows]) =>
              rows.length > 0 && (
                <div key={label} className="space-y-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h2>
                  <div className="space-y-1.5">
                    {rows.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => openItem(n)}
                        className={cn(
                          'flex w-full items-start justify-between gap-3 rounded-2xl border bg-card p-4 text-left transition hover:shadow-sm',
                          !n.isRead && 'border-primary/30 bg-primary-soft/30',
                        )}
                      >
                        <div className="min-w-0">
                          <p className={cn('flex items-center gap-1.5 text-sm', !n.isRead && 'font-semibold')}>
                            {!n.isRead && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                            {n.title}
                          </p>
                          {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          <RelativeTime iso={n.createdAt} />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ),
          )}
          {hasNextPage && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
