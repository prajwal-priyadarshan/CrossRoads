import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TEAM_KINDS, TEAM_ROLES, teamCreateSchema, type TeamKind } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/layout/PageHeader';
import { FormField } from '@/components/shared/FormField';
import { ChipToggleGroup } from '@/components/shared/ChipPicker';
import { ChipPicker } from '@/components/shared/ChipPicker';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useCreateTeam } from './api';

const DESCRIPTION_PLACEHOLDER: Record<TeamKind, string> = {
  HACKATHON: 'What are you building and for which hackathon?',
  PROJECT: 'What are you building and why?',
  STARTUP: 'The problem, your idea, and what stage you are at.',
  STUDY_CIRCLE: "Goal, e.g. finish Striver's sheet together in 8 weeks.",
};

export function TeamNewPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const create = useCreateTeam();
  const initialKind = (params.get('kind') as TeamKind) ?? 'HACKATHON';

  const [kind, setKind] = useState<TeamKind>(initialKind);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [rolesNeeded, setRolesNeeded] = useState<string[]>([]);
  const [commitment, setCommitment] = useState('');
  const [maxMembers, setMaxMembers] = useState(4);
  const [schedule, setSchedule] = useState('');
  const [meetingDetails, setMeetingDetails] = useState('');
  const [openJoin, setOpenJoin] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const parsed = teamCreateSchema.safeParse({
      kind,
      title,
      description,
      requiredSkills,
      rolesNeeded,
      commitment,
      maxMembers,
      meetingDetails,
      schedule,
      openJoin,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message;
      return setErrors(next);
    }
    setErrors({});
    create.mutate(parsed.data, {
      onSuccess: ({ id }) => {
        toast.success('Listing created');
        navigate(`/teams/${id}`);
      },
      onError: (e) => {
        if (e instanceof ApiError && e.fields) setErrors(e.fields);
      },
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Create a listing" description="Find teammates for a hackathon, a project, a startup or a study circle." />

      <FormField label="Kind">
        <div className="grid gap-3 sm:grid-cols-2">
          {TEAM_KINDS.map((k) => {
            const on = kind === k.value;
            return (
              <button
                key={k.value}
                type="button"
                aria-pressed={on}
                onClick={() => setKind(k.value)}
                className={cn(
                  'flex items-center gap-2 rounded-2xl border p-3 text-left text-sm font-medium transition hover:border-primary/50',
                  on && 'border-primary bg-primary-soft',
                )}
              >
                {k.label}
                {on && <Check className="ml-auto size-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </FormField>

      <FormField label="Title" htmlFor="t-title" error={errors.title}>
        <Input id="t-title" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!errors.title} />
      </FormField>

      <FormField label="Description" htmlFor="t-desc" error={errors.description}>
        <Textarea
          id="t-desc"
          rows={5}
          value={description}
          maxLength={2000}
          placeholder={DESCRIPTION_PLACEHOLDER[kind]}
          onChange={(e) => setDescription(e.target.value)}
          aria-invalid={!!errors.description}
        />
      </FormField>

      <FormField label="Required skills" error={errors.requiredSkills}>
        <ChipPicker value={requiredSkills} onChange={setRequiredSkills} options={[]} max={10} placeholder="Add a skill" />
      </FormField>

      <FormField label="Roles needed" error={errors.rolesNeeded} hint="Cross-department roles stand out">
        <ChipToggleGroup value={rolesNeeded} onChange={setRolesNeeded} options={TEAM_ROLES} max={8} tone="warm" />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Commitment" htmlFor="t-commitment" hint="e.g. 6 h/week for 4 weeks">
          <Input id="t-commitment" value={commitment} maxLength={80} onChange={(e) => setCommitment(e.target.value)} />
        </FormField>
        <FormField label="Max members" htmlFor="t-max">
          <Input
            id="t-max"
            type="number"
            min={2}
            max={20}
            value={maxMembers}
            onChange={(e) => setMaxMembers(Number(e.target.value) || 2)}
          />
        </FormField>
      </div>

      <FormField label="Schedule" htmlFor="t-schedule" hint="e.g. Tue & Thu 7–8 pm">
        <Input id="t-schedule" value={schedule} maxLength={120} onChange={(e) => setSchedule(e.target.value)} />
      </FormField>

      <FormField label="Meeting details" htmlFor="t-meeting" hint="Where and how you meet — no video calls in the app">
        <Textarea id="t-meeting" rows={2} value={meetingDetails} maxLength={300} onChange={(e) => setMeetingDetails(e.target.value)} />
      </FormField>

      {kind === 'STUDY_CIRCLE' && (
        <div className="flex items-center justify-between rounded-xl border p-3">
          <div>
            <p className="text-sm font-medium">Let people join instantly</p>
            <p className="text-xs text-muted-foreground">No application needed — one click to join.</p>
          </div>
          <Switch checked={openJoin} onCheckedChange={setOpenJoin} />
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={submit} disabled={create.isPending}>
          {create.isPending && <Loader2 className="animate-spin" />} Create listing
        </Button>
        <Button variant="ghost" onClick={() => navigate('/teams')}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
