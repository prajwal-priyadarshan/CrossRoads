import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { OPPORTUNITY_TYPES, postCreateSchema, type OpportunityType } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/layout/PageHeader';
import { AppIcon } from '@/components/shared/AppIcon';
import { FormField } from '@/components/shared/FormField';
import { TagInput } from '@/components/shared/TagInput';
import { ApiError } from '@/lib/api';
import { OPPORTUNITY_TONE } from '@/lib/labels';
import { cn } from '@/lib/utils';
import { useCreatePost, useTopics } from '@/features/community/api';

export function OpportunityNewPage() {
  const navigate = useNavigate();
  const create = useCreatePost();
  const { data: topics = [] } = useTopics();
  const [type, setType] = useState<OpportunityType | null>(null);
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [body, setBody] = useState('');
  const [deadline, setDeadline] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [topicId, setTopicId] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    if (!type) return setErrors({ opportunityType: 'Choose a type' });
    const parsed = postCreateSchema.safeParse({
      kind: 'OPPORTUNITY',
      title,
      body,
      opportunityType: type,
      organization: organization || undefined,
      deadline: deadline || undefined,
      externalUrl: externalUrl || undefined,
      topicId: topicId ?? undefined,
      tags,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message;
      return setErrors(next);
    }
    setErrors({});
    create.mutate(parsed.data, {
      onSuccess: ({ id, alerted }) => {
        toast.success(
          alerted
            ? `Shared! ${alerted} ${alerted === 1 ? 'student' : 'students'} with matching alerts were notified.`
            : 'Shared with the campus.',
        );
        navigate(`/post/${id}`);
      },
      onError: (e) => {
        if (e instanceof ApiError && e.fields) setErrors(e.fields);
        else toast.error(e.message);
      },
    });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Share an opportunity"
        description="Internships, hackathons, research spots, referrals — if it helped you, it can help someone else."
      />
      <div className="space-y-5">
        <FormField
          label="Type"
          error={errors.opportunityType}
          hint="Students whose alerts match this type, topic or tags will be notified."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {OPPORTUNITY_TYPES.map((t) => {
              const on = type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setType(t.value)}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border p-3 text-left transition hover:border-primary/50',
                    on && 'border-primary bg-primary-soft',
                  )}
                >
                  <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', OPPORTUNITY_TONE[t.value])}>
                    <AppIcon name={t.icon} className="size-4" />
                  </span>
                  <span className="text-sm font-medium">{t.label}</span>
                  {on && <Check className="ml-auto size-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </FormField>

        <FormField label="Title" htmlFor="o-title" error={errors.title}>
          <Input
            id="o-title"
            value={title}
            maxLength={200}
            placeholder="e.g. Summer research internship at the ML lab"
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={!!errors.title}
          />
        </FormField>

        <FormField label="Organisation (optional)" htmlFor="o-org" error={errors.organization}>
          <Input
            id="o-org"
            value={organization}
            maxLength={80}
            placeholder="Company, lab or club"
            onChange={(e) => setOrganization(e.target.value)}
          />
        </FormField>

        <FormField label="Details" htmlFor="o-body" error={errors.body}>
          <Textarea
            id="o-body"
            rows={6}
            value={body}
            maxLength={5000}
            placeholder="What is it, who is it for, how do people apply, and anything they should know."
            onChange={(e) => setBody(e.target.value)}
          />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Deadline (optional)" htmlFor="o-deadline" error={errors.deadline}>
            <Input id="o-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </FormField>
          <FormField label="Link (optional)" htmlFor="o-url" error={errors.externalUrl}>
            <Input
              id="o-url"
              type="url"
              value={externalUrl}
              placeholder="https://…"
              onChange={(e) => setExternalUrl(e.target.value)}
              aria-invalid={!!errors.externalUrl}
            />
          </FormField>
        </div>

        <FormField label="Topic (optional)" error={errors.topicId}>
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => {
              const on = topicId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTopicId(on ? null : t.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition',
                    on ? 'border-transparent bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  <AppIcon name={t.icon} className="size-3.5" />
                  {t.name}
                </button>
              );
            })}
          </div>
        </FormField>

        <FormField label="Tags" htmlFor="o-tags" error={errors.tags}>
          <TagInput id="o-tags" value={tags} onChange={setTags} />
        </FormField>

        <div className="flex gap-2">
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending && <Loader2 className="animate-spin" />} Share opportunity
          </Button>
          <Button variant="ghost" onClick={() => navigate('/opportunities')}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
