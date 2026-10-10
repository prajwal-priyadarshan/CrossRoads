import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TOPICS, postCreateSchema } from '@bridgeup/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/layout/PageHeader';
import { AppIcon } from '@/components/shared/AppIcon';
import { FormField } from '@/components/shared/FormField';
import { TagInput } from '@/components/shared/TagInput';
import { ApiError } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { useCreatePost } from '@/features/community/api';
import { SimilarQuestions } from './SimilarQuestions';

export function AskNewPage() {
  const navigate = useNavigate();
  const create = useCreatePost();
  const [params] = useSearchParams();
  const [title, setTitle] = useState(params.get('title') ?? '');
  const [body, setBody] = useState('');
  const [topicId, setTopicId] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const debounced = useDebounce(title, 300);

  const submit = () => {
    const parsed = postCreateSchema.safeParse({ kind: 'QUESTION', title, body, topicId: topicId ?? undefined, tags });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message;
      return setErrors(next);
    }
    setErrors({});
    create.mutate(parsed.data, {
      onSuccess: ({ id }) => {
        toast.success('Question posted. Seniors who know this topic have been notified.');
        navigate(`/ask/${id}`);
      },
      onError: (e) => {
        if (e instanceof ApiError && e.fields) setErrors(e.fields);
        else toast.error(e.message);
      },
    });
  };

  return (
    <div>
      <PageHeader title="Ask a question" description="Be kind. No ragging. Don't share confidential interview questions." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <FormField label="Your question" htmlFor="q-title" error={errors.title}>
            <Input
              id="q-title"
              value={title}
              maxLength={200}
              placeholder="e.g. Which coding club should I join in first year?"
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!errors.title}
            />
            <p className="tabular text-right text-xs text-muted-foreground">{title.length}/200</p>
          </FormField>

          {/* On mobile the similar-questions panel sits before the details field */}
          <div className="lg:hidden">
            <SimilarQuestions query={debounced} />
          </div>

          <FormField label="Details (optional)" htmlFor="q-body">
            <Textarea
              id="q-body"
              rows={6}
              value={body}
              maxLength={5000}
              placeholder="Add context: your year, what you've tried, what you're unsure about."
              onChange={(e) => setBody(e.target.value)}
            />
          </FormField>

          <FormField label="Topic" error={errors.topicId}>
            <div className="grid gap-3 sm:grid-cols-2">
              {TOPICS.map((t, i) => {
                const on = topicId === i + 1;
                return (
                  <button
                    key={t.slug}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setTopicId(i + 1)}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border p-3 text-left transition hover:border-primary/50',
                      on && 'border-primary bg-primary-soft',
                    )}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-primary">
                      <AppIcon name={t.icon} className="size-4" />
                    </span>
                    <span className="text-sm font-medium">{t.name}</span>
                    {on && <Check className="ml-auto size-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </FormField>

          <FormField label="Tags" htmlFor="q-tags" error={errors.tags}>
            <TagInput id="q-tags" value={tags} onChange={setTags} />
          </FormField>

          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending && <Loader2 className="animate-spin" />} Post question
          </Button>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <SimilarQuestions query={debounced} />
          </div>
        </aside>
      </div>
    </div>
  );
}
