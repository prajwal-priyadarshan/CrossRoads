import type { ReactNode } from 'react';
import { Loader2, MessageSquareDashed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { FeedSkeleton } from '@/components/shared/Skeletons';
import { usePosts, type PostParams } from './api';
import { PostCard } from './PostCard';

export function PostFeed({
  params,
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'Be the first to start a conversation.',
  emptyAction,
}: {
  params: PostParams;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}) {
  const q = usePosts(params);
  if (q.isLoading) return <FeedSkeleton />;
  if (q.error) return <p className="text-sm text-destructive">Could not load posts. {q.error.message}</p>;
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  if (!items.length) {
    return <EmptyState icon={MessageSquareDashed} title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }
  return (
    <div className="space-y-4">
      {items.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
      {q.hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>
            {q.isFetchingNextPage && <Loader2 className="animate-spin" />} Load more
          </Button>
        </div>
      )}
    </div>
  );
}
