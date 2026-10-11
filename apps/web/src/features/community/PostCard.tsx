import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { CheckCircle2, MessageSquare, MoreHorizontal, Trash2 } from 'lucide-react';
import type { PostCard as Post } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppIcon } from '@/components/shared/AppIcon';
import { BookmarkButton } from '@/components/shared/BookmarkButton';
import { ReportButton } from '@/components/shared/ReportButton';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { VoteButtons } from '@/components/shared/VoteButtons';
import { useMe } from '@/hooks/useMe';
import { roleLabel } from '@/components/shared/RoleBadge';
import { cn, titleCase } from '@/lib/utils';
import { useDeletePost } from './api';

export const postHref = (p: Pick<Post, 'id' | 'kind'>) => (p.kind === 'QUESTION' ? `/ask/${p.id}` : `/post/${p.id}`);

/** `author` is null when that person has since deleted their account; their content stays, attributed to no one. */
export function AuthorLine({ author, role = true }: { author: Post['author']; role?: boolean }) {
  if (!author) {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[9px]">?</span>
        <span className="font-medium">A deleted user</span>
      </span>
    );
  }
  const senior = author.role === 'SENIOR' || author.role === 'ALUMNI';
  return (
    <span className="inline-flex items-center gap-1.5">
      <UserAvatar user={author} size="sm" className="size-5 text-[9px]" />
      <Link
        to={`/u/${author.handle}`}
        onClick={(e) => e.stopPropagation()}
        className="font-medium text-foreground hover:underline"
      >
        {author.fullName}
      </Link>
      {role && (
        <span className={cn('text-xs', senior ? 'font-semibold text-primary' : 'text-muted-foreground')}>
          {roleLabel(author.role, author.currentYear)}
        </span>
      )}
    </span>
  );
}

export function PostCard({ post, reason }: { post: Post; reason?: ReactNode }) {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const del = useDeletePost();
  const isQuestion = post.kind === 'QUESTION';
  const canDelete = me && ((post.author && me.id === post.author.id) || me.role === 'ADMIN');
  const href = postHref(post);

  return (
    <article
      onClick={() => navigate(href)}
      className="flex cursor-pointer gap-4 rounded-2xl border bg-card p-4 transition hover:border-primary/40 hover:shadow-sm"
    >
      <div className="hidden sm:block" onClick={(e) => e.stopPropagation()}>
        {isQuestion ? (
          <div
            className={cn(
              'grid w-16 place-items-center rounded-xl border py-2 text-center',
              post.hasBestAnswer
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'text-muted-foreground',
            )}
          >
            <span className="tabular text-lg font-semibold leading-none">{post.commentCount}</span>
            <span className="text-[11px]">{post.commentCount === 1 ? 'answer' : 'answers'}</span>
          </div>
        ) : (
          <VoteButtons
            targetType="POST"
            targetId={post.id}
            score={post.score}
            myVote={post.myVote}
            invalidate={['posts']}
          />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {isQuestion && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              Question
            </span>
          )}
          {post.kind === 'OPPORTUNITY' && post.opportunityType && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {titleCase(post.opportunityType.replace(/_/g, ' ').toLowerCase())}
            </span>
          )}
          {post.topic && (
            <Link
              to={`/community/${post.topic.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 hover:text-foreground"
            >
              <AppIcon name={post.topic.icon} className="size-3" />
              {post.topic.name}
            </Link>
          )}
          <AuthorLine author={post.author} />
          {post.officeName && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
              Official · {post.officeName}
            </span>
          )}
          <span aria-hidden>·</span>
          <RelativeTime iso={post.createdAt} />
          {reason}
        </div>

        <h3 className="break-words text-[17px] font-semibold leading-snug hover:underline">{post.title}</h3>
        {post.excerpt && <p className="line-clamp-2 break-words text-sm text-muted-foreground">{post.excerpt}</p>}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
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

        <div className="flex items-center gap-3 pt-1 text-sm text-muted-foreground" onClick={(e) => e.stopPropagation()}>
          <div className="sm:hidden">
            <VoteButtons
              targetType="POST"
              targetId={post.id}
              score={post.score}
              myVote={post.myVote}
              orientation="horizontal"
              invalidate={['posts']}
            />
          </div>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-4" />
            <span className="tabular">{post.commentCount}</span>
          </span>
          {post.hasBestAnswer && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="size-3.5" /> Answered
            </span>
          )}
          {isQuestion && post.hasSeniorAnswer && (
            <span className="text-xs font-medium text-primary">Answered by a senior</span>
          )}
          <BookmarkButton targetType="POST" targetId={post.id} bookmarked={post.bookmarked} className="ml-auto" />
          {!canDelete && (
            <ReportButton targetType="POST" targetId={post.id} variant="icon" className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" />
          )}
          {canDelete && (
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7" aria-label="More actions">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => {
                      if (window.confirm('Delete this post?')) del.mutate(post.id);
                    }}
                  >
                    <Trash2 /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
