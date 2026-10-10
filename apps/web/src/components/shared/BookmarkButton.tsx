import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type TargetType = 'POST' | 'EXPERIENCE' | 'ROADMAP' | 'STORY';

/** Optimistic bookmark toggle. */
export function BookmarkButton({
  targetType,
  targetId,
  bookmarked,
  className,
}: {
  targetType: TargetType;
  targetId: string;
  bookmarked: boolean;
  className?: string;
}) {
  const qc = useQueryClient();
  const [on, setOn] = useState(bookmarked);
  useEffect(() => setOn(bookmarked), [bookmarked]);

  const m = useMutation({
    mutationFn: () => api<{ bookmarked: boolean }>('/bookmarks', { method: 'PUT', json: { targetType, targetId } }),
    onMutate: () => {
      const prev = on;
      setOn(!prev);
      return { prev };
    },
    onSuccess: (res) => {
      setOn(res.bookmarked);
      toast.success(res.bookmarked ? 'Saved to bookmarks' : 'Removed from bookmarks');
    },
    onError: (_e, _v, ctx) => {
      if (ctx) setOn(ctx.prev);
      toast.error('Could not update bookmarks');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['bookmarks'] });
      qc.invalidateQueries({ queryKey: ['posts'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? 'Remove bookmark' : 'Bookmark'}
      onClick={(e) => {
        e.stopPropagation();
        m.mutate();
      }}
      className={cn(
        'grid size-8 place-items-center rounded-lg transition hover:bg-muted',
        on ? 'text-primary' : 'text-muted-foreground',
        className,
      )}
    >
      {on ? <BookmarkCheck className="size-4 fill-current" /> : <Bookmark className="size-4" />}
    </button>
  );
}
