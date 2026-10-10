import { useEffect, useState } from 'react';
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { ArrowBigDown, ArrowBigUp, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type Props = {
  targetType: 'POST' | 'COMMENT';
  targetId: string;
  score: number;
  myVote: number;
  orientation?: 'vertical' | 'horizontal';
  variant?: 'updown' | 'helpful';
  /** Query key prefix to refresh after the vote settles */
  invalidate?: QueryKey;
  className?: string;
};

/** Optimistic vote control. Clicking the active arrow removes the vote. */
export function VoteButtons({
  targetType,
  targetId,
  score,
  myVote,
  orientation = 'vertical',
  variant = 'updown',
  invalidate,
  className,
}: Props) {
  const qc = useQueryClient();
  const [state, setState] = useState({ score, myVote });
  useEffect(() => setState({ score, myVote }), [score, myVote]); // sync when server data changes

  const m = useMutation({
    mutationFn: (value: -1 | 0 | 1) =>
      api<{ score: number; myVote: number }>('/votes', { method: 'PUT', json: { targetType, targetId, value } }),
    onMutate: (value) => {
      const prev = state;
      setState({ score: state.score - state.myVote + value, myVote: value }); // optimistic
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx) setState(ctx.prev);
      toast.error('Could not save your vote');
    },
    onSuccess: (res) => setState(res),
    onSettled: () => {
      if (invalidate) qc.invalidateQueries({ queryKey: invalidate });
    },
  });

  const click = (v: 1 | -1) => m.mutate(state.myVote === v ? 0 : v);

  if (variant === 'helpful') {
    const on = state.myVote === 1;
    return (
      <button
        type="button"
        aria-pressed={on}
        aria-label="Mark as helpful"
        onClick={() => click(1)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition',
          on ? 'border-transparent bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-muted',
          className,
        )}
      >
        <ThumbsUp className={cn('size-4', on && 'fill-current')} />
        Helpful · <span className="tabular">{state.score}</span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1',
        orientation === 'vertical' ? 'flex-col' : 'flex-row rounded-full border px-1',
        className,
      )}
    >
      <button
        type="button"
        aria-label="Upvote"
        aria-pressed={state.myVote === 1}
        onClick={() => click(1)}
        className={cn('rounded-md p-0.5 transition hover:bg-muted', state.myVote === 1 ? 'text-primary' : 'text-muted-foreground')}
      >
        <ArrowBigUp className={cn('size-6', state.myVote === 1 && 'fill-current')} />
      </button>
      <span key={state.score} className="tabular min-w-6 animate-in fade-in text-center text-sm font-semibold">
        {state.score}
      </span>
      <button
        type="button"
        aria-label="Downvote"
        aria-pressed={state.myVote === -1}
        onClick={() => click(-1)}
        className={cn('rounded-md p-0.5 transition hover:bg-muted', state.myVote === -1 ? 'text-destructive' : 'text-muted-foreground')}
      >
        <ArrowBigDown className={cn('size-6', state.myVote === -1 && 'fill-current')} />
      </button>
    </div>
  );
}
