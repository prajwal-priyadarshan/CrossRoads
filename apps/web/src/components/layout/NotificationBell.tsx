import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Award,
  Bell,
  Briefcase,
  Info,
  MessageCircle,
  MessageSquare,
  UserCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { NotificationItem, NotificationType } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { useMarkRead, useNotifications, useUnreadCount } from '@/features/notifications/api';
import { cn } from '@/lib/utils';

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  ANSWER: MessageCircle,
  COMMENT: MessageSquare,
  REQUEST: UserPlus,
  REQUEST_RESPONSE: UserCheck,
  APPLICATION: Users,
  BADGE: Award,
  OPPORTUNITY: Briefcase,
  MENTION: MessageSquare,
  SYSTEM: Info,
};

function Row({ n, onOpen }: { n: NotificationItem; onOpen: (n: NotificationItem) => void }) {
  const Icon = TYPE_ICON[n.type] ?? Info;
  return (
    <button
      type="button"
      onClick={() => onOpen(n)}
      className={cn('flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition hover:bg-muted', !n.isRead && 'bg-primary-soft/40')}
    >
      <span
        className={cn(
          'mt-0.5 grid size-8 shrink-0 place-items-center rounded-full',
          n.type === 'BADGE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('flex items-center gap-1.5 text-sm leading-snug', !n.isRead && 'font-semibold')}>
          {!n.isRead && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
          {n.title}
        </p>
        {n.body && <p className="line-clamp-1 text-xs text-muted-foreground">{n.body}</p>}
        <p className="mt-0.5 text-xs text-muted-foreground">
          <RelativeTime iso={n.createdAt} />
        </p>
      </div>
    </button>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: unread } = useUnreadCount();
  const { data, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const items = (data?.pages[0]?.items ?? []).slice(0, 8);
  const count = unread?.count ?? 0;

  const openItem = (n: NotificationItem) => {
    if (!n.isRead) markRead.mutate({ ids: [n.id] });
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
          className="relative"
        >
          <Bell className="size-4" />
          {count > 0 && (
            <span className="tabular absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-white">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <p className="font-display text-sm font-semibold">Notifications</p>
          {count > 0 && (
            <button
              type="button"
              onClick={() => markRead.mutate({ all: true })}
              className="text-xs font-medium text-primary hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          <div className="space-y-1 p-2">
            {isLoading ? (
              <p className="p-3 text-center text-sm text-muted-foreground">Loading…</p>
            ) : !items.length ? (
              <p className="p-3 text-center text-sm text-muted-foreground">You're all caught up ✨</p>
            ) : (
              items.map((n) => <Row key={n.id} n={n} onOpen={openItem} />)
            )}
          </div>
        </ScrollArea>
        <div className="border-t p-2 text-center">
          <Link to="/notifications" onClick={() => setOpen(false)} className="text-xs font-medium text-primary hover:underline">
            See all
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
