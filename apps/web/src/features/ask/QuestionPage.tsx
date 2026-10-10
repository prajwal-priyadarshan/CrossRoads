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
import { useMe } from '@/hooks/useMe';
import { qk } from '@/lib/queryKeys';
import { useDeletePost, useMarkBest, usePost } from '@/features/community/api';
import { AuthorCard } from '@/features/community/AuthorCard';
import { ReplyBox } from '@/features/community/CommentThread';
import { AuthorLine } from '@/features/community/PostCard';
import { AnswerCard } from './AnswerCard';
import { SimilarQuestions } from './SimilarQuestions';

export function QuestionPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data, isLoading, error } = usePost(id);
  const markBest = useMarkBest(id);
  const del = useDeletePost();

  if (isLoading || !me) return <ProfileSkeleton />;
  if (error || !data) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Post not found"
        description="It may have been deleted."
        action={
          <Button asChild>
            <Link to="/ask">Back to Ask a Senior</Link>
          </Button>
        }
      />
    );
  }
  const { post, comments, canMarkBest } = data;
  if (post.kind !== 'QUESTION') return <Navigate to={`/post/${post.id}`} replace />;
  const canDelete = data.isAuthor || me.role === 'ADMIN';
  const isHelper = me.role === 'SENIOR' || me.role === 'ALUMNI';

  return (
    <RightRail
      rail={
        <>
          <AuthorCard author={post.author} title="Asked by" connectLabel="Connect with the asker" />
          <SimilarQuestions query={post.title} exclude={post.id} title="Related questions" />
        </>
      }
    >
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
              <span className="rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                Question
              </span>
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
            {post.body && <PlainText text={post.body} />}
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
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => {
                  if (window.confirm('Delete this question?')) del.mutate(post.id, { onSuccess: () => navigate('/ask') });
                }}
              >
                <Trash2 /> Delete
              </Button>
            )}
          </div>
        </article>

        <section className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold">
              {comments.length} {comments.length === 1 ? 'answer' : 'answers'}
            </h2>
            {comments.length > 1 && (
              <p className="text-xs text-muted-foreground">Best answer first, then most helpful.</p>
            )}
          </div>
          {comments.length === 0 && (
            <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              No answers yet. Seniors who know this topic have been notified.
            </p>
          )}
          {comments.map((c) => (
            <AnswerCard
              key={c.id}
              answer={c}
              postId={post.id}
              questionTitle={post.title}
              asker={post.author}
              meId={me.id}
              canMarkBest={canMarkBest}
              onMarkBest={(cid) => markBest.mutate(cid)}
            />
          ))}
        </section>

        <section className="space-y-2 rounded-2xl border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">Your answer</h2>
          <p className="text-xs text-muted-foreground">
            {isHelper
              ? 'Your answer will help every future batch.'
              : "Seniors' answers are highlighted, but your experience counts too!"}
          </p>
          <ReplyBox postId={post.id} placeholder="Share what worked for you…" submitLabel="Post answer" />
        </section>
      </div>
    </RightRail>
  );
}
