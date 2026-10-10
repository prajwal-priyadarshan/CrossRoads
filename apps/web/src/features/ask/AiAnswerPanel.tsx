import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Sparkles } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { RoleBadge } from '@/components/shared/RoleBadge';

type Source = {
  n: number;
  questionId: string;
  questionTitle: string;
  answer: string;
  isBest: boolean;
  author: { id: string; handle: string; fullName: string; avatarUrl: string | null; role: string; currentYear: number | null };
};

type AiAnswerResult =
  | { status: 'no_sources'; sources: [] }
  | { status: 'fallback'; sources: Source[] }
  | { status: 'ok'; answer: string; citations: number[]; sources: Source[] };

/**
 * Grounds an AI answer in seniors' past answers to similar questions, with
 * citations. Works without an AI key too — it just shows the raw sources
 * instead of a synthesized answer.
 */
export function AiAnswerPanel({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const ask = useMutation({
    mutationFn: () => api<AiAnswerResult>('/ai/answer', { method: 'POST', json: { questionId } }),
  });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          ask.mutate();
        }}
        className="inline-flex items-center gap-1.5 self-start rounded-full border border-primary/30 bg-primary-soft px-3 py-1.5 text-sm font-medium text-primary transition hover:border-primary/50"
      >
        <Sparkles className="size-3.5" /> Ask AI (grounded in past answers)
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4">
      <p className="flex items-center gap-1.5 text-sm font-semibold">
        <Sparkles className="size-4 text-primary" /> AI answer
      </p>

      {ask.isPending && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Looking through similar questions…
        </p>
      )}

      {ask.isError && (
        <p className="text-sm text-muted-foreground">
          {ask.error instanceof ApiError ? ask.error.message : 'Could not get an answer right now.'}
        </p>
      )}

      {ask.data?.status === 'no_sources' && (
        <p className="text-sm text-muted-foreground">No similar answered questions yet — be the first senior to answer this one.</p>
      )}

      {ask.data && ask.data.status !== 'no_sources' && (
        <div className="space-y-3">
          {ask.data.status === 'ok' && <p className="whitespace-pre-wrap text-sm">{ask.data.answer}</p>}
          {ask.data.status === 'fallback' && (
            <p className="text-sm text-muted-foreground">
              AI generation isn't available right now — here are the similar answers it would have cited.
            </p>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Sources</p>
            {ask.data.sources.map((s) => (
              <Link
                key={s.n}
                to={`/ask/${s.questionId}`}
                className="flex gap-2 rounded-xl border bg-muted/40 p-2.5 text-sm transition hover:bg-muted"
              >
                <span className="tabular shrink-0 text-xs font-semibold text-primary">[{s.n}]</span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UserAvatar user={s.author} size="sm" />
                    {s.author.fullName}
                    <RoleBadge role={s.author.role as 'STUDENT' | 'SENIOR' | 'ALUMNI' | 'ADMIN'} currentYear={s.author.currentYear} />
                    {s.isBest && <span className="text-amber-600 dark:text-amber-400">★ best answer</span>}
                  </p>
                  <p className="mt-1 line-clamp-2 text-muted-foreground">{s.answer}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
