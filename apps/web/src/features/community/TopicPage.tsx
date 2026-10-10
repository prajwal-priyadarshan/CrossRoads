import { useState } from 'react';
import { useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/shared/AppIcon';
import { EmptyState } from '@/components/shared/EmptyState';
import { RightRail } from '@/components/layout/RightRail';
import { useFollowTopic, useTopics } from './api';
import { YourTopics } from './CommunityPage';
import { Composer } from './Composer';
import { PostFeed } from './PostFeed';
import { COMMUNITY_SORTS, SortToggle } from './SortToggle';
import { TopicTabs } from './TopicTabs';
import { Compass } from 'lucide-react';

export function TopicPage() {
  const { topic = '' } = useParams();
  const { data: topics, isLoading } = useTopics();
  const follow = useFollowTopic();
  const [sort, setSort] = useState<'latest' | 'top' | 'top_all'>('latest');
  const t = topics?.find((x) => x.slug === topic);

  if (!isLoading && !t) {
    return <EmptyState icon={Compass} title="Topic not found" description="Pick a topic from the community page." />;
  }

  return (
    <div className="space-y-4">
      <TopicTabs active={topic} />
      {t && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-5">
          <div className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <AppIcon name={t.icon} className="size-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold">{t.name}</h1>
            <p className="text-sm text-muted-foreground">{t.description}</p>
            <p className="tabular mt-1 text-xs text-muted-foreground">
              {t.followers} followers · {t.posts} posts
            </p>
          </div>
          <Button
            variant={t.followed ? 'secondary' : 'default'}
            onClick={() => follow.mutate({ id: t.id, follow: !t.followed })}
          >
            {t.followed ? 'Following' : 'Follow'}
          </Button>
        </div>
      )}
      <RightRail rail={<YourTopics />}>
        <div className="space-y-4">
          <SortToggle value={sort} onChange={setSort} options={COMMUNITY_SORTS} />
          <Composer defaultTopicSlug={topic} />
          <PostFeed params={{ topic, sort }} emptyTitle="No posts in this topic yet" />
        </div>
      </RightRail>
    </div>
  );
}
