import { useState, type FormEvent } from 'react';
import { BookOpen, Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { GuideAnswer } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { EmptyState } from '@/components/shared/EmptyState';
import { ApiError, api } from '@/lib/api';

/** Floating helper that answers questions about the project from its own documents, with sources. */
export function ProjectGuide() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<GuideAnswer | null>(null);
  const [loading, setLoading] = useState(false);

  const ask = async (e: FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (q.length < 3 || loading) return;
    setLoading(true);
    try {
      setResult(await api<GuideAnswer>('/guide/ask', { method: 'POST', json: { question: q } }));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not get an answer. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        className="fixed bottom-20 right-4 z-40 rounded-full shadow-md lg:bottom-6 lg:right-6"
        onClick={() => setOpen(true)}
      >
        <MessageCircle /> Ask about the project
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-4 sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Ask about the project</SheetTitle>
            <SheetDescription>
              Answers come from the project's own documents. Each answer links to the sections it came from.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={ask} className="flex gap-2 px-4">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={400}
              placeholder="For example: how does matching work?"
              aria-label="Your question"
            />
            <Button type="submit" disabled={loading || question.trim().length < 3}>
              {loading ? <Loader2 className="animate-spin" /> : 'Ask'}
            </Button>
          </form>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
            {result?.status === 'ok' && <p className="whitespace-pre-wrap text-sm leading-relaxed">{result.answer}</p>}
            {result?.status === 'fallback' && (
              <p className="text-sm text-muted-foreground">
                A written answer is not available right now. These sections match your question.
              </p>
            )}
            {result?.status === 'no_match' && (
              <EmptyState
                icon={BookOpen}
                title="Nothing in the project documents matches that"
                description="Try words from a feature name, such as matching, feed or simulator."
              />
            )}
            {result && result.sources.length > 0 && (
              <ol className="space-y-2">
                {result.sources.map((s) => (
                  <li key={`${s.file}-${s.heading}-${s.n}`} className="rounded-lg border p-3 text-sm">
                    <p className="font-medium">{s.heading}</p>
                    <p className="text-xs text-muted-foreground">{s.file}</p>
                    <p className="mt-1 line-clamp-3 text-muted-foreground">{s.excerpt}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
