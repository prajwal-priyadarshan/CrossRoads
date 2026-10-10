import { Link } from 'react-router';
import { Bookmark } from 'lucide-react';
import type { BookmarkList } from '@crossroads/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { FeedSkeleton } from '@/components/shared/Skeletons';
import { PostCard } from '@/features/community/PostCard';
import { useBookmarks } from './api';

type Simple = BookmarkList['experiences'][number];

function SimpleList({ items }: { items: Simple[] }) {
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.id}>
          <Link to={i.url} className="block rounded-2xl border bg-card p-4 transition hover:border-primary/40">
            <p className="font-semibold">{i.title}</p>
            <p className="text-sm text-muted-foreground">{i.subtitle}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const Empty = () => (
  <EmptyState icon={Bookmark} title="Nothing saved yet" description="Save useful posts with the bookmark icon." />
);

export function BookmarksPage() {
  const { data, isLoading } = useBookmarks();
  const tabs = [
    { value: 'posts', label: 'Posts & questions', count: data?.posts.length ?? 0 },
    { value: 'experiences', label: 'Experiences', count: data?.experiences.length ?? 0 },
    { value: 'roadmaps', label: 'Roadmaps', count: data?.roadmaps.length ?? 0 },
    { value: 'stories', label: 'Stories', count: data?.stories.length ?? 0 },
  ];

  return (
    <div>
      <PageHeader title="Bookmarks" description="Everything you saved, in one place. Only you can see this." />
      {isLoading || !data ? (
        <FeedSkeleton />
      ) : (
        <Tabs defaultValue="posts">
          <TabsList className="h-auto flex-wrap justify-start">
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label} <span className="tabular ml-1 text-muted-foreground">{t.count}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="posts" className="mt-6 space-y-4">
            {data.posts.length ? data.posts.map((p) => <PostCard key={p.id} post={p} />) : <Empty />}
          </TabsContent>
          <TabsContent value="experiences" className="mt-6">
            {data.experiences.length ? <SimpleList items={data.experiences} /> : <Empty />}
          </TabsContent>
          <TabsContent value="roadmaps" className="mt-6">
            {data.roadmaps.length ? <SimpleList items={data.roadmaps} /> : <Empty />}
          </TabsContent>
          <TabsContent value="stories" className="mt-6">
            {data.stories.length ? <SimpleList items={data.stories} /> : <Empty />}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
