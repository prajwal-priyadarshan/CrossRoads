import type { ComponentType, ReactNode } from 'react';
import { Link } from 'react-router';
import { differenceInCalendarDays, format, formatDistanceToNowStrict } from 'date-fns';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  ExternalLink,
  HandHeart,
  Inbox,
  MessageCircleQuestion,
  NotebookPen,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { RailData, WeekEvent } from '@bridgeup/shared';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AppIcon } from '@/components/shared/AppIcon';
import { MatchRing } from '@/components/shared/MatchRing';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ConnectDialog } from '@/features/people/ConnectDialog';
import { useRespond } from '@/features/requests/api';
import { CONNECTION_KINDS } from '@/lib/people';
import { cn, titleCase } from '@/lib/utils';

export function RailCard({
  title,
  href,
  linkLabel = 'See all',
  children,
  className,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-2xl border bg-card p-4', className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-semibold">{title}</h2>
        {href && (
          <Link to={href} className="text-xs font-medium text-primary hover:underline">
            {linkLabel}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function RailSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3 rounded-2xl border bg-card p-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}

// ───────────── This Week ─────────────
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

// ───────────── Quests (first years) ─────────────
function questCopy(done: number, total: number) {
  if (done === total) return "All done. You're a natural!";
  if (done >= total / 2) return "You're settling in well.";
  if (done > 0) return 'Great start!';
  return 'Small steps for your first weeks. Only you can see these.';
}

export function QuestsCard({ quests }: { quests: NonNullable<RailData['quests']> }) {
  return (
    <RailCard title="Your first-year quests">
      <div className="mb-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{questCopy(quests.done, quests.total)}</span>
          <span className="tabular font-semibold">
            {quests.done} of {quests.total}
          </span>
        </div>
        <Progress value={(quests.done / quests.total) * 100} aria-label="Quest progress" />
      </div>
      <ul className="space-y-1">
        {quests.items.map((q) => (
          <li key={q.id}>
            <Link
              to={q.href}
              className={cn('flex items-start gap-2 rounded-lg p-1.5 text-sm transition hover:bg-muted', q.done && 'text-muted-foreground')}
            >
              {q.done ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0">
                <span className={cn('block font-medium', q.done && 'line-through')}>{q.label}</span>
                {!q.done && <span className="block text-xs text-muted-foreground">{q.hint}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </RailCard>
  );
}

// ───────────── Ways to help (seniors / alumni) ─────────────
const WAY_ICON: Record<string, ComponentType<{ className?: string }>> = {
  answer: MessageCircleQuestion,
  requests: Inbox,
  clubs: Sparkles,
  experience: NotebookPen,
};

export function WaysToHelp({ ways }: { ways: NonNullable<RailData['waysToHelp']> }) {
  return (
    <RailCard title="Ways to help today">
      {ways.length === 0 ? (
        <p className="text-sm text-muted-foreground">You're all caught up. Thank you for helping!</p>
      ) : (
        <ul className="space-y-1">
          {ways.map((w) => {
            const Icon = WAY_ICON[w.id] ?? HandHeart;
            return (
              <li key={w.id}>
                <Link to={w.href} className="flex items-center gap-2.5 rounded-lg p-2 text-sm transition hover:bg-muted">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="flex-1">{w.label}</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </RailCard>
  );
}

// ───────────── Suggested people ─────────────
export function SuggestedPeople({ people }: { people: RailData['suggested'] }) {
  if (!people.length) return null;
  return (
    <RailCard title="People for you" href="/people">
      <ul className="space-y-3">
        {people.map((p) => (
          <li key={p.id} className="flex items-center gap-2.5">
            <UserAvatar user={p} size="md" />
            <div className="min-w-0 flex-1">
              <Link to={`/u/${p.handle}`} className="block truncate text-sm font-semibold hover:underline">
                {p.fullName}
              </Link>
              <p className="truncate text-xs text-muted-foreground">{p.match.reasons[0]}</p>
            </div>
            <MatchRing score={p.match.score} size={32} />
            <ConnectDialog
              recipient={p}
              trigger={
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                  Connect
                </Button>
              }
            />
          </li>
        ))}
      </ul>
    </RailCard>
  );
}

// ───────────── Pending requests ─────────────
export function PendingRequests({ requests }: { requests: RailData['pendingRequests'] }) {
  const respond = useRespond();
  if (!requests.length) return null;
  return (
    <RailCard title="Requests for you" href="/requests">
      <ul className="space-y-3">
        {requests.map((r) => (
          <li key={r.id} className="space-y-2">
            <div className="flex items-center gap-2.5">
              <UserAvatar user={r.requester} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{r.requester.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  <RoleBadge role={r.requester.role} currentYear={r.requester.currentYear} /> ·{' '}
                  {CONNECTION_KINDS[r.kind].label}
                </p>
              </div>
            </div>
            {r.topic && <p className="line-clamp-2 text-xs font-medium">{r.topic}</p>}
            <div className="flex gap-2">
              <Button size="sm" className="h-7" disabled={respond.isPending} onClick={() => respond.mutate({ id: r.id, status: 'ACCEPTED' })}>
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7"
                disabled={respond.isPending}
                onClick={() => respond.mutate({ id: r.id, status: 'DECLINED' })}
              >
                Decline
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </RailCard>
  );
}

// ───────────── Recent opportunities ─────────────
export function RecentOpportunities({ items }: { items: RailData['opportunities'] }) {
  return (
    <RailCard title="Opportunities" href="/opportunities">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No open opportunities right now.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((o) => (
            <li key={o.id}>
              <Link to={`/post/${o.id}`} className="block rounded-lg p-1.5 transition hover:bg-muted">
                <p className="line-clamp-2 text-sm font-medium">{o.title}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  {o.opportunityType && <span>{titleCase(o.opportunityType.toLowerCase().replace(/_/g, ' '))}</span>}
                  {o.organization && <span>· {o.organization}</span>}
                  {o.deadline && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Due {format(new Date(o.deadline), 'd MMM')}
                    </span>
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </RailCard>
  );
}

// ───────────── Trending topics ─────────────
export function TrendingTopics({ topics }: { topics: RailData['trending'] }) {
  if (!topics.length) return null;
  return (
    <RailCard title="Trending this week" href="/community">
      <ul className="space-y-1.5">
        {topics.map((t, i) => (
          <li key={t.slug}>
            <Link to={`/community/${t.slug}`} className="flex items-center gap-2.5 rounded-lg p-1.5 text-sm transition hover:bg-muted">
              <span className="tabular w-4 text-xs font-semibold text-muted-foreground">{i + 1}</span>
              <AppIcon name={t.icon} className="size-4 text-primary" />
              <span className="min-w-0 flex-1 truncate">{t.name}</span>
              <span className="tabular inline-flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="size-3" /> {t.activity} {t.activity === 1 ? 'post' : 'posts'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </RailCard>
  );
}

// ───────────── Story spotlight ─────────────
export function StorySpotlight({ story }: { story: NonNullable<RailData['spotlight']> }) {
  return (
    <RailCard title="Story spotlight" href="/stories">
      {story.coverUrl && <img src={story.coverUrl} alt="" className="mb-3 aspect-[16/9] w-full rounded-xl object-cover" />}
      <p className="font-semibold">{story.title}</p>
      <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{story.excerpt}</p>
      <Button asChild variant="link" className="mt-1 h-auto px-0">
        <Link to={`/stories/${story.slug}`}>Read story</Link>
      </Button>
    </RailCard>
  );
}

// ───────────── Quick links ─────────────
const QUICK_LINKS = [
  { to: '/settings/profile#skills', label: 'Update skills & interests' },
  { to: '/settings/profile#goals', label: 'Edit my goals' },
  { to: '/opportunities?alerts=1', label: 'Notification settings' },
  { to: '/people?mode=mentor', label: 'Find a mentor' },
];

export function QuickLinks() {
  return (
    <RailCard title="Quick links">
      <ul className="space-y-0.5">
        {QUICK_LINKS.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="flex items-center justify-between rounded-lg p-1.5 text-sm transition hover:bg-muted">
              {l.label}
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </RailCard>
  );
}
