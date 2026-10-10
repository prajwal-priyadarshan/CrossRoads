import { useState } from 'react';
import { Link } from 'react-router';
import { PageHeader } from '@/components/layout/PageHeader';
import { RightRail } from '@/components/layout/RightRail';
import { AppIcon } from '@/components/shared/AppIcon';
import { Button } from '@/components/ui/button';
import { MentorWall } from '@/components/gamification/MentorWall';
import { useFollowTopic, useTopics } from './api';
import { COMMUNITY_SORTS, SortToggle } from './SortToggle';
import { Composer } from './Composer';
import { PostFeed } from './PostFeed';
import { TopicTabs } from './TopicTabs';

export function YourTopics() {
  const { data: topics } = useTopics();
  const follow = useFollowTopic();
  if (!topics) return null;
  return (
    <div className="rounded-2xl border bg-card p-4">
      <h2 className="mb-3 font-display text-base font-semibold">Your topics</h2>
      <ul className="space-y-2">
        {topics.map((t) => (
          <li key={t.id} className="flex items-center gap-2">
            <AppIcon name={t.icon} className="size-4 text-primary" />
            <Link to={`/community/${t.slug}`} className="flex-1 truncate text-sm hover:underline">
              {t.name}
            </Link>
            <Button
              variant={t.followed ? 'secondary' : 'outline'}
              size="sm"
              className="h-7"
              onClick={() => follow.mutate({ id: t.id, follow: !t.followed })}
            >
              {t.followed ? 'Following' : 'Follow'}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CommunityPage() {
  const [sort, setSort] = useState<'latest' | 'top' | 'top_all'>('latest');
  return (
    <div>
      <PageHeader title="Community" description="Discuss, share and learn with your campus." />
      <div className="space-y-4">
        <TopicTabs />
        <RightRail
          rail={
            <>
              <YourTopics />
              <MentorWall />
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex justify-between gap-2">
              <SortToggle value={sort} onChange={setSort} options={COMMUNITY_SORTS} />
            </div>
            <Composer />
            <PostFeed params={{ sort }} emptyTitle="No posts yet" />
          </div>
        </RightRail>
      </div>
    </div>
  );
}
