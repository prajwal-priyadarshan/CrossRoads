import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TOPICS, postCreateSchema } from '@bridgeup/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/components/shared/FormField';
import { TagInput } from '@/components/shared/TagInput';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ApiError } from '@/lib/api';
import { useMe } from '@/hooks/useMe';
import { useCreatePost } from './api';

/** Collapsed it looks like an input; expanded it is the discussion form. Topic ids follow the seeded order. */
export function Composer({ defaultTopicSlug }: { defaultTopicSlug?: string }) {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const create = useCreatePost();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const defaultId = TOPICS.findIndex((t) => t.slug === defaultTopicSlug) + 1;
  const [topicId, setTopicId] = useState<string>(defaultId > 0 ? String(defaultId) : '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!me) return null;

  const reset = () => {
    setOpen(false);
    setTitle('');
    setBody('');
    setTags([]);
    setErrors({});
  };

  const submit = () => {
    const parsed = postCreateSchema.safeParse({ kind: 'DISCUSSION', title, body, topicId: topicId || undefined, tags });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message;
      return setErrors(next);
    }
    setErrors({});
    create.mutate(parsed.data, {
      onSuccess: ({ id }) => {
        toast.success('Posted');
        reset();
        navigate(`/post/${id}`);
      },
      onError: (e) => {
        if (e instanceof ApiError && e.fields) setErrors(e.fields);
        else toast.error(e.message);
      },
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left text-muted-foreground transition hover:border-primary/40"
      >
        <UserAvatar user={me} size="md" />
        Start a discussion…
      </button>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-4">
      <FormField label="Title" htmlFor="c-title" error={errors.title}>
        <Input id="c-title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </FormField>
      <FormField label="Details (optional)" htmlFor="c-body">
        <Textarea id="c-body" rows={4} value={body} maxLength={10000} onChange={(e) => setBody(e.target.value)} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Topic" error={errors.topicId}>
          <Select value={topicId || undefined} onValueChange={setTopicId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a topic" />
            </SelectTrigger>
            <SelectContent>
              {TOPICS.map((t, i) => (
                <SelectItem key={t.slug} value={String(i + 1)}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Tags" htmlFor="c-tags" error={errors.tags}>
          <TagInput id="c-tags" value={tags} onChange={setTags} />
        </FormField>
      </div>
      <div className="flex items-center justify-between">
        <Link to="/ask/new" className="text-sm text-primary hover:underline">
          Asking for help? Use Ask a Senior →
        </Link>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={reset}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending && <Loader2 className="animate-spin" />} Post
          </Button>
        </div>
      </div>
    </div>
  );
}
