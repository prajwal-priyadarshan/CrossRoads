import { Fragment, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Loader2, MessageCircleQuestion, MessagesSquare, Rss } from 'lucide-react';
import type { Me } from '@bridgeup/shared';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AppIcon } from '@/components/shared/AppIcon';
import { EmptyState } from '@/components/shared/EmptyState';
import { FeedSkeleton } from '@/components/shared/Skeletons';
import { ReasonChip } from '@/components/shared/ReasonChip';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useMe } from '@/hooks/useMe';
import { cn } from '@/lib/utils';
import { Composer } from '@/features/community/Composer';
import { PostCard } from '@/features/community/PostCard';
import { SortToggle } from '@/features/community/SortToggle';
import { useFollowTopic, useTopics } from '@/features/community/api';
import { useFeed, useRail, type FeedTab } from './api';
import {
  PendingRequests,
  QuestsCard,
  QuickLinks,
  RailSkeleton,
  RecentOpportunities,
  StorySpotlight,
  SuggestedPeople,
  ThisWeek,
  TrendingTopics,
  WaysToHelp,
} from './rail';

function greetingWord() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function Greeting({ me, helpCount }: { me: Me; helpCount: number }) {
  const first = me.fullName.split(' ')[0];
  const helper = me.role === 'SENIOR' || me.role === 'ALUMNI';
  const line =
    me.role === 'STUDENT' && (me.currentYear ?? 1) <= 1
      ? "Here's what matters for you this week."
      : helper && helpCount > 0
        ? `${helpCount} junior${helpCount === 1 ? '' : 's'} could use your help today.`
        : 'Pick up where you left off.';
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight md:text-[28px]">
        {greetingWord()}, {first}
      </h1>
      <p className="mt-1 text-muted-foreground">{line}</p>
    </div>
  );
}

function ComposerCard({ me, onDiscuss }: { me: Me; onDiscuss: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3">
      <UserAvatar user={me} size="md" />
      <div className="flex flex-1 flex-wrap gap-2">
        <Button asChild className="flex-1">
          <Link to="/ask/new">
            <MessageCircleQuestion /> Ask a senior
          </Link>
        </Button>
        <Button variant="outline" className="flex-1" onClick={onDiscuss}>
          <MessagesSquare /> Start a discussion
        </Button>
      </div>
      <Link to="/opportunities/new" className="w-full text-center text-xs text-primary hover:underline sm:w-auto">
        Share an opportunity
      </Link>
    </div>
  );
}

function TopicChips({ value, onChange }: { value: string; onChange: (slug: string) => void }) {
  const { data: topics } = useTopics();
  const sorted = [...(topics ?? [])].sort((a, b) => Number(b.followed) - Number(a.followed));
  const items = [{ slug: '', name: 'All', icon: 'hash' }, ...sorted];
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((t) => (
        <button
          key={t.slug || 'all'}
          type="button"
          aria-pressed={value === t.slug}
          onClick={() => onChange(t.slug)}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition',
            value === t.slug ? 'border-transparent bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-muted',
          )}
        >
          <AppIcon name={t.icon} className="size-3.5" />
          {t.name}
        </button>
      ))}
    </div>
  );
}

function FollowTopicsEmpty() {
  const { data: topics } = useTopics();
  const follow = useFollowTopic();
  return (
    <EmptyState
      icon={Rss}
      title="Follow a few topics to personalise your feed"
      description="Pick what you care about. You can change this anytime."
      action={
        <div className="flex flex-wrap justify-center gap-2">
          {topics?.map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant={t.followed ? 'secondary' : 'outline'}
              onClick={() => follow.mutate({ id: t.id, follow: !t.followed })}
            >
              <AppIcon name={t.icon} /> {t.followed ? 'Following' : t.name}
            </Button>
          ))}
        </div>
      }
    />
  );
}

export function HomePage() {
  const { data: me } = useMe();
  const [sp, setSp] = useSearchParams();
  const tab = (['foryou', 'latest', 'top'].includes(sp.get('tab') ?? '') ? sp.get('tab') : 'foryou') as FeedTab;
  const [topic, setTopic] = useState('');
  const [discussOpen, setDiscussOpen] = useState(false);
  const feed = useFeed(tab, topic || undefined);
  const rail = useRail();
  const { data: topics } = useTopics();

  if (!me) return <FeedSkeleton />;

  const r = rail.data;
  const items = feed.data?.pages.flatMap((p) => p.items) ?? [];
  const followsNone = topics && !topics.some((t) => t.followed);
  const helpCount = r?.waysToHelp?.find((w) => w.id === 'answer')?.count ?? 0;

  // On mobile, This Week and Quests appear after the 3rd feed item; the rest of the rail sits at the bottom
  const earlyRail = r && (
    <div className="space-y-4 lg:hidden">
      <ThisWeek events={r.thisWeek} />
      {r.quests && <QuestsCard quests={r.quests} />}
      {r.waysToHelp && <WaysToHelp ways={r.waysToHelp} />}
    </div>
  );

  const railContent = rail.isLoading ? (
    <RailSkeleton />
  ) : r ? (
    <>
      <div className="hidden space-y-4 lg:block">
        <ThisWeek events={r.thisWeek} />
        {r.quests && <QuestsCard quests={r.quests} />}
        {r.waysToHelp && <WaysToHelp ways={r.waysToHelp} />}
      </div>
      <PendingRequests requests={r.pendingRequests} />
      <SuggestedPeople people={r.suggested} />
      <RecentOpportunities items={r.opportunities} />
      <TrendingTopics topics={r.trending} />
      {r.spotlight && <StorySpotlight story={r.spotlight} />}
      <QuickLinks />
    </>
  ) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-5">
        <Greeting me={me} helpCount={helpCount} />
        <ComposerCard me={me} onDiscuss={() => setDiscussOpen(true)} />

        <div className="space-y-3">
          <SortToggle<FeedTab>
            label="Feed"
            value={tab}
            onChange={(v) => setSp(v === 'foryou' ? {} : { tab: v })}
            options={[
              { value: 'foryou', label: 'For you' },
              { value: 'latest', label: 'Latest' },
              { value: 'top', label: 'Top this week' },
            ]}
          />
          <TopicChips value={topic} onChange={setTopic} />
        </div>

        {feed.isLoading ? (
          <FeedSkeleton />
        ) : items.length === 0 ? (
          <>
            {followsNone && tab === 'foryou' ? (
              <FollowTopicsEmpty />
            ) : (
              <EmptyState icon={Rss} title="Nothing here yet" description="Ask a question or start a discussion to get things going." />
            )}
            {earlyRail}
          </>
        ) : (
          <div className="space-y-4">
            {items.map((p, i) => (
              <Fragment key={p.id}>
                <PostCard post={p} reason={p.reason ? <ReasonChip>{p.reason}</ReasonChip> : undefined} />
                {i === 2 && earlyRail}
              </Fragment>
            ))}
            {items.length < 3 && earlyRail}
            {feed.hasNextPage && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => feed.fetchNextPage()} disabled={feed.isFetchingNextPage}>
                  {feed.isFetchingNextPage && <Loader2 className="animate-spin" />} Load more
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <aside className="space-y-4 self-start lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pb-4">
        {railContent}
      </aside>

      <Dialog open={discussOpen} onOpenChange={setDiscussOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Start a discussion</DialogTitle>
          </DialogHeader>
          <Composer defaultOpen onClose={() => setDiscussOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
