import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CommentNode } from '@bridgeup/shared';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PlainText } from '@/components/shared/PlainText';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { VoteButtons } from '@/components/shared/VoteButtons';
import { qk } from '@/lib/queryKeys';
import { useCreateComment } from './api';
import { AuthorLine } from './PostCard';

export function ReplyBox({
  postId,
  parentId,
  placeholder,
  onDone,
  submitLabel = 'Reply',
}: {
  postId: string;
  parentId?: string;
  placeholder?: string;
  onDone?: () => void;
  submitLabel?: string;
}) {
  const [body, setBody] = useState('');
  const create = useCreateComment(postId);
  const submit = () =>
    create.mutate(
      { body, parentId },
      {
        onSuccess: ({ pointsEarned }) => {
          setBody('');
          if (pointsEarned > 0) toast.success(`+${pointsEarned} helpfulness. Thank you for helping!`);
          else toast.success(parentId ? 'Reply posted' : 'Comment posted');
          onDone?.();
        },
        onError: (e) => toast.error(e.message),
      },
    );
  return (
    <div className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={parentId ? 2 : 3}
        maxLength={5000}
        placeholder={placeholder}
        aria-label={placeholder ?? 'Write a comment'}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={create.isPending || body.trim().length < 2}>
          {create.isPending && <Loader2 className="animate-spin" />} {submitLabel}
        </Button>
        {onDone && (
          <Button size="sm" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

function Comment({ node, postId, reply }: { node: CommentNode; postId: string; reply: boolean }) {
  const [replying, setReplying] = useState(false);
  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">
        <AuthorLine author={node.author} /> · <RelativeTime iso={node.createdAt} />
      </div>
      <PlainText text={node.body} />
      <div className="flex items-center gap-3">
        <VoteButtons
          targetType="COMMENT"
          targetId={node.id}
          score={node.score}
          myVote={node.myVote}
          orientation="horizontal"
          invalidate={qk.post(postId)}
        />
        {!reply && (
          <Button variant="ghost" size="sm" onClick={() => setReplying((r) => !r)}>
            Reply
          </Button>
        )}
      </div>
      {replying && (
        <ReplyBox
          postId={postId}
          parentId={node.id}
          placeholder="Write a reply…"
          onDone={() => setReplying(false)}
        />
      )}
    </div>
  );
}

/** Comments with one level of replies. */
export function CommentThread({ comments, postId }: { comments: CommentNode[]; postId: string }) {
  if (!comments.length) return <p className="text-sm text-muted-foreground">No comments yet. Start the conversation.</p>;
  return (
    <ul className="space-y-6">
      {comments.map((c) => (
        <li key={c.id}>
          <Comment node={c} postId={postId} reply={false} />
          {c.replies.length > 0 && (
            <ul className="mt-4 space-y-4 border-l-2 pl-4">
              {c.replies.map((r) => (
                <li key={r.id}>
                  <Comment node={r} postId={postId} reply />
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
