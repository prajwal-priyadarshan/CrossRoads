import { useState } from 'react';
import { Link } from 'react-router';
import { CheckCircle2 } from 'lucide-react';
import type { CommentNode, UserLite } from '@bridgeup/shared';
import { Button } from '@/components/ui/button';
import { PlainText } from '@/components/shared/PlainText';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { VoteButtons } from '@/components/shared/VoteButtons';
import { ConnectDialog } from '@/features/people/ConnectDialog';
import { ReplyBox } from '@/features/community/CommentThread';
import { AuthorLine } from '@/features/community/PostCard';
import { qk } from '@/lib/queryKeys';
import { personSubline } from '@/lib/people';
import { cn } from '@/lib/utils';

export function AnswerCard({
  answer,
  postId,
  questionTitle,
  asker,
  meId,
  canMarkBest,
  onMarkBest,
}: {
  answer: CommentNode;
  postId: string;
  questionTitle: string;
  asker: UserLite;
  meId: string;
  canMarkBest: boolean;
  onMarkBest: (id: string) => void;
}) {
  const [replying, setReplying] = useState(false);
  const a = answer.author;
  const senior = a.role === 'SENIOR' || a.role === 'ALUMNI';
  const mine = a.id === meId;
  const iAmAsker = asker.id === meId;

  return (
    <article
      className={cn(
        'space-y-3 rounded-2xl border bg-card p-5',
        answer.isBest && 'border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20',
      )}
    >
      {answer.isBest && (
        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="size-4" /> Best answer
        </p>
      )}
      <div className="flex items-center gap-3">
        <UserAvatar user={a} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/u/${a.handle}`} className="font-semibold hover:underline">
              {a.fullName}
            </Link>
            {senior && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                {a.role === 'ALUMNI' ? 'Alumni' : 'Senior'}
              </span>
            )}
            {a.isVerified && <VerifiedBadge />}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {personSubline({ ...a, batchYear: null })} · <RelativeTime iso={answer.createdAt} />
          </p>
        </div>
      </div>

      <PlainText text={answer.body} />

      <div className="flex flex-wrap items-center gap-2">
        <VoteButtons
          targetType="COMMENT"
          targetId={answer.id}
          score={answer.score}
          myVote={answer.myVote}
          variant="helpful"
          invalidate={qk.post(postId)}
        />
        <Button variant="ghost" size="sm" onClick={() => setReplying((r) => !r)}>
          Reply
        </Button>
        {canMarkBest && !answer.isBest && !mine && (
          <Button variant="outline" size="sm" onClick={() => onMarkBest(answer.id)}>
            Mark as best
          </Button>
        )}
        {!mine && senior && (
          <ConnectDialog
            recipient={a}
            defaultKind="MENTORSHIP"
            defaultTopic={questionTitle.slice(0, 160)}
            trigger={
              <Button variant="outline" size="sm">
                Request mentorship
              </Button>
            }
          />
        )}
        {mine && !iAmAsker && (
          <ConnectDialog
            recipient={asker}
            defaultKind="MENTORSHIP"
            defaultTopic={questionTitle.slice(0, 160)}
            defaultMessage="Happy to talk more about this. Want to set up a short chat?"
            trigger={
              <Button variant="outline" size="sm">
                Offer mentorship
              </Button>
            }
          />
        )}
      </div>

      {answer.replies.length > 0 && (
        <ul className="space-y-4 border-l-2 pl-4">
          {answer.replies.map((r) => (
            <li key={r.id} className="space-y-2">
              <div className="text-xs text-muted-foreground">
                <AuthorLine author={r.author} /> · <RelativeTime iso={r.createdAt} />
              </div>
              <PlainText text={r.body} />
              <VoteButtons
                targetType="COMMENT"
                targetId={r.id}
                score={r.score}
                myVote={r.myVote}
                orientation="horizontal"
                invalidate={qk.post(postId)}
              />
            </li>
          ))}
        </ul>
      )}

      {replying && (
        <ReplyBox postId={postId} parentId={answer.id} placeholder="Write a reply…" onDone={() => setReplying(false)} />
      )}
    </article>
  );
}
