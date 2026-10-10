import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { FileQuestion, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RightRail } from '@/components/layout/RightRail';
import { AppIcon } from '@/components/shared/AppIcon';
import { EmptyState } from '@/components/shared/EmptyState';
import { PlainText } from '@/components/shared/PlainText';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { ProfileSkeleton } from '@/components/shared/Skeletons';
import { VoteButtons } from '@/components/shared/VoteButtons';
import { BookmarkButton } from '@/components/shared/BookmarkButton';
import { useMe } from '@/hooks/useMe';
import { qk } from '@/lib/queryKeys';
import { useDeletePost, usePost } from './api';
import { AuthorCard } from './AuthorCard';
import { CommentThread, ReplyBox } from './CommentThread';
import { AuthorLine } from './PostCard';

export function PostPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data, isLoading, error } = usePost(id);
  const del = useDeletePost();

  if (isLoading) return <ProfileSkeleton />;
  if (error || !data) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Post not found"
        description="It may have been deleted."
        action={
          <Button asChild>
            <Link to="/community">Back to community</Link>
          </Button>
        }
      />
    );
  }
  const { post, comments } = data;
  if (post.kind === 'QUESTION') return <Navigate to={`/ask/${post.id}`} replace />;
  const canDelete = me && (data.isAuthor || me.role === 'ADMIN');

  return (
    <RightRail rail={<AuthorCard author={post.author} />}>
      <div className="space-y-6">
        <article className="flex gap-4 rounded-2xl border bg-card p-5">
          <div className="hidden sm:block">
            <VoteButtons
              targetType="POST"
              targetId={post.id}
              score={post.score}
              myVote={post.myVote}
              invalidate={qk.post(post.id)}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {post.topic && (
                <Link
                  to={`/community/${post.topic.slug}`}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 hover:text-foreground"
                >
                  <AppIcon name={post.topic.icon} className="size-3" /> {post.topic.name}
                </Link>
              )}
              <AuthorLine author={post.author} /> · <RelativeTime iso={post.createdAt} />
            </div>
            <h1 className="break-words font-display text-2xl font-semibold">{post.title}</h1>
            {post.organization && <p className="text-sm text-muted-foreground">{post.organization}</p>}
            {post.body && <PlainText text={post.body} />}
            {post.externalUrl && (
              <Button asChild variant="outline" size="sm">
                <a href={post.externalUrl} target="_blank" rel="noopener noreferrer">
                  Open link
                </a>
              </Button>
            )}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((t) => (
                  <Link
                    key={t}
                    to={`/community/tag/${encodeURIComponent(t)}`}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1">
              <BookmarkButton targetType="POST" targetId={post.id} bookmarked={post.bookmarked} />
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => {
                  if (window.confirm('Delete this post?')) del.mutate(post.id, { onSuccess: () => navigate('/community') });
                }}
              >
                <Trash2 /> Delete
              </Button>
            )}
            </div>
          </div>
        </article>

        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold">
            {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
          </h2>
          <ReplyBox postId={post.id} placeholder="Add a comment…" submitLabel="Comment" />
          <CommentThread comments={comments} postId={post.id} />
        </section>
      </div>
    </RightRail>
  );
}
