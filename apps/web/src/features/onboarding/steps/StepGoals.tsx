import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Check } from 'lucide-react';
import { GOAL_TRACKS, TARGET_ROLES, TOPICS, stepGoalsSchema } from '@bridgeup/shared';
import { FormField } from '@/components/shared/FormField';
import { ChipPicker } from '@/components/shared/ChipPicker';
import { cn } from '@/lib/utils';
import { AppIcon as Icon } from '@/components/shared/AppIcon';
import type { StepProps } from './types';

type In = z.input<typeof stepGoalsSchema>;
type Out = z.output<typeof stepGoalsSchema>;

// Topic ids are the seeded order (1..6), see prisma/seed.ts; replaced by GET /topics in Phase 04.
const TOPIC_CARDS = TOPICS.map((t, i) => ({ ...t, id: i + 1 }));

export function StepGoals({ draft, onSubmit, formId, interests }: StepProps<'goals'> & { interests: string[] }) {
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<In, unknown, Out>({
    resolver: zodResolver(stepGoalsSchema),
    defaultValues: draft ?? { goalTrack: undefined, targetRoles: [], targetCompanies: [], followTopicIds: [] },
  });

  // Preselect topics from interests the first time this step is shown
  useEffect(() => {
    if (draft || getValues('followTopicIds').length) return;
    const text = interests.join(' ');
    const picks = TOPIC_CARDS.filter((t) =>
      (t.slug === 'ai-ml' && /ai|ml|data/.test(text)) ||
      (t.slug === 'dsa-leetcode' && /competitive|programming/.test(text)) ||
      (t.slug === 'hackathons-projects' && /open source|web|app/.test(text)) ||
      (t.slug === 'internships' && /startup|product/.test(text)),
    ).map((t) => t.id);
    setValue('followTopicIds', picks.length ? picks : [TOPIC_CARDS[2]!.id]);
  }, [draft, interests, getValues, setValue]);

  return (
    <form id={formId} onSubmit={handleSubmit((v) => onSubmit(v as In))} className="space-y-6" noValidate>
      <FormField label="Your main goal" error={errors.goalTrack ? 'Pick the closest match' : undefined}>
        <Controller
          control={control}
          name="goalTrack"
          render={({ field }) => (
            <div className="grid gap-3 sm:grid-cols-2">
              {GOAL_TRACKS.map((g) => {
                const selected = field.value === g.value;
                return (
                  <button
                    key={g.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => field.onChange(g.value)}
                    className={cn(
                      'relative flex items-start gap-3 rounded-2xl border p-4 text-left transition hover:border-primary/50',
                      selected && 'border-primary bg-primary-soft',
                    )}
                  >
                    {selected && <Check className="absolute right-3 top-3 size-4 text-primary" />}
                    <Icon name={g.icon} className="mt-0.5 size-5 shrink-0 text-primary" />
                    <span>
                      <span className="block text-sm font-semibold">{g.label}</span>
                      <span className="block text-xs text-muted-foreground">{g.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        />
      </FormField>

      <FormField label="Target roles (optional)" htmlFor="targetRoles">
        <Controller
          control={control}
          name="targetRoles"
          render={({ field }) => (
            <ChipPicker
              id="targetRoles"
              value={field.value ?? []}
              onChange={field.onChange}
              options={TARGET_ROLES}
              max={5}
              placeholder="Search or add a role"
            />
          )}
        />
      </FormField>

      <FormField label="Topics to follow" error={errors.followTopicIds?.message}>
        <Controller
          control={control}
          name="followTopicIds"
          render={({ field }) => (
            <div className="grid gap-3 sm:grid-cols-2">
              {TOPIC_CARDS.map((t) => {
                const on = field.value.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      field.onChange(on ? field.value.filter((x) => x !== t.id) : [...field.value, t.id])
                    }
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border p-3 text-left transition hover:border-primary/50',
                      on && 'border-primary bg-primary-soft',
                    )}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-primary">
                      <Icon name={t.icon} className="size-4" />
                    </span>
                    <span className="text-sm font-medium">{t.name}</span>
                    {on && <Check className="ml-auto size-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        />
      </FormField>
    </form>
  );
}
