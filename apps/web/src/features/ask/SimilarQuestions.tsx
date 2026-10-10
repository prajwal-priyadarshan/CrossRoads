import { CheckCircle2 } from 'lucide-react';
import { useSimilarQuestions } from '@/features/community/api';

/** "Already answered?" panel. Each result opens in a new tab so the form is never lost. */
export function SimilarQuestions({ query, exclude, title = 'Already answered?' }: { query: string; exclude?: string; title?: string }) {
  const { data, isFetching } = useSimilarQuestions(query);
  const items = (data ?? []).filter((q) => q.id !== exclude);
  const ready = query.trim().length >= 8;

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4">
      <h2 className="font-display text-base font-semibold">{title}</h2>
      {!ready && <p className="text-sm text-muted-foreground">Start typing your question. We will look for similar ones.</p>}
      {ready && isFetching && !data && <p className="text-sm text-muted-foreground">Searching…</p>}
      {ready && data && items.length === 0 && (
        <p className="text-sm text-muted-foreground">No similar questions. You're asking something new!</p>
      )}
      {items.length > 0 && (
        <ul className="space-y-2 animate-in fade-in">
          {items.map((q) => (
            <li key={q.id}>
              <a
                href={`/ask/${q.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border p-3 text-sm transition hover:border-primary/40"
              >
                <span className="line-clamp-2 font-medium">{q.title}</span>
                <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="tabular">
                    {q.commentCount} {q.commentCount === 1 ? 'answer' : 'answers'}
                  </span>
                  {q.hasBest && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="size-3" /> Best answer
                    </span>
                  )}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
