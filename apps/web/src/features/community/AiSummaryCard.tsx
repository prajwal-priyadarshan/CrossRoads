import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

type SummaryResult =
  | { status: 'ok'; bullets: string[]; citations: number[] }
  | { status: 'fallback'; bullets: string[] };

export function AiSummaryCard({ postId, companySlug, companyName }: { postId?: string; companySlug?: string; companyName?: string }) {
  const [expanded, setExpanded] = useState(false);

  // Company summary: auto-load
  const companyQ = useQuery({
    queryKey: ['ai-summary', 'company', companySlug],
    queryFn: () => api<SummaryResult>('/ai/summary', { method: 'POST', json: { companySlug } }),
    enabled: Boolean(companySlug),
    staleTime: 24 * 60 * 60 * 1000,
  });

  // Thread summary: load on demand
  const threadMut = useMutation({
    mutationFn: () => api<SummaryResult>('/ai/summary', { method: 'POST', json: { postId } }),
  });

  if (companySlug) {
    if (companyQ.isLoading) {
      return (
        <Card>
          <CardHeader className="pb-2"><Skeleton className="h-4 w-48" /></CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </CardContent>
        </Card>
      );
    }
    if (!companyQ.data) return null;
    const { data } = companyQ;
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            {data.status === 'ok' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                <Sparkles className="size-3" /> AI summary
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Summary
              </span>
            )}
            {companyName && <span className="text-muted-foreground font-normal">What seniors say about {companyName}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {data.bullets.map((b, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary/50" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  }

  // Thread summary
  if (!postId) return null;
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => { setExpanded(true); threadMut.mutate(); }}
        className="inline-flex items-center gap-1.5 self-start rounded-full border border-primary/30 bg-primary-soft px-3 py-1.5 text-sm font-medium text-primary transition hover:border-primary/50"
      >
        <Sparkles className="size-3.5" /> Summarise this discussion
      </button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="size-4 text-primary" /> Discussion summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {threadMut.isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Summarising…
          </div>
        )}
        {threadMut.isError && <p className="text-sm text-muted-foreground">Could not summarise this discussion.</p>}
        {threadMut.data && (
          <ul className="space-y-1">
            {threadMut.data.bullets.map((b, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <a href={`#c-${threadMut.data?.status === 'ok' ? threadMut.data.citations : []?.[i]}`} className="mt-1 size-1.5 shrink-0 rounded-full bg-primary/50 hover:bg-primary" aria-label={`Citation ${i + 1}`} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
