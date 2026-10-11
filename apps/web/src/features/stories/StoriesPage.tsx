import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { PublicPageHeader } from '@/components/layout/PublicPageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/Skeletons';
import { StoryCard } from './StoryCard';
import { useStories } from './api';

export function StoriesPage() {
  const [tag, setTag] = useState<string | undefined>(undefined);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useStories(tag);
  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const allTags = [...new Set(items.flatMap((s) => s.tags))].slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <PublicPageHeader />
      <div className="mx-auto max-w-5xl space-y-5 px-6 py-10">
      <PageHeader title="Success stories" description="Journeys from your campus — placements, startups, research and more." />

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={!tag}
            onClick={() => setTag(undefined)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${!tag ? 'border-transparent bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-muted'}`}
          >
            All
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tag === t}
              onClick={() => setTag(t)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition ${tag === t ? 'border-transparent bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : !items.length ? (
        <EmptyState icon={BookOpen} title="No stories yet" description="Spotlights and journeys will show up here." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </div>
          {hasNextPage && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
