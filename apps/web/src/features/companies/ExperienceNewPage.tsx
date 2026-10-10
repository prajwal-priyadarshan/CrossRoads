import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ArrowDown, ArrowUp, Loader2, Plus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { experienceCreateSchema, experienceRoundSchema, ROUND_TYPES, type ExperienceRound } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/layout/PageHeader';
import { ChipPicker } from '@/components/shared/ChipPicker';
import { DifficultyDots } from '@/components/shared/DifficultyDots';
import { EmptyState } from '@/components/shared/EmptyState';
import { FormField } from '@/components/shared/FormField';
import { useMe } from '@/hooks/useMe';
import { ApiError } from '@/lib/api';
import { ROUND_TYPE_LABEL } from '@/lib/labels';
import { useCompanies, useCreateExperience } from './api';

const STEPS = ['Basics', 'Rounds', 'Preparation', 'Outcome & privacy'] as const;
const thisYear = new Date().getFullYear();
const emptyRound = (): ExperienceRound => ({ name: '', type: 'TECHNICAL', topics: [], difficulty: 3, notes: '' });

type Errors = Record<string, string>;

export function ExperienceNewPage() {
  const { data: me } = useMe();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { data: companies } = useCompanies();
  const create = useCreateExperience();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});

  const [companySlug, setCompanySlug] = useState(params.get('company') ?? '');
  const [role, setRole] = useState('');
  const [year, setYear] = useState(thisYear);
  const [difficulty, setDifficulty] = useState(3);
  const [rounds, setRounds] = useState<ExperienceRound[]>([emptyRound()]);
  const [prepWeeks, setPrepWeeks] = useState('');
  const [resources, setResources] = useState('');
  const [tips, setTips] = useState('');
  const [outcome, setOutcome] = useState<'SELECTED' | 'NOT_SELECTED' | 'WITHHELD'>('WITHHELD');
  const [ack, setAck] = useState(false);

  if (!me) return null;
  if (me.role === 'STUDENT' && (me.currentYear ?? 1) === 1) {
    return (
      <EmptyState
        icon={Star}
        title="Experiences come from students who've been through a process"
        description="As a first year, the best thing you can do is read experiences and ask seniors about them."
        action={
          <Button asChild>
            <Link to="/companies">Browse companies</Link>
          </Button>
        }
      />
    );
  }

  const company = companies?.find((c) => c.slug === companySlug);
  const setRound = (i: number, patch: Partial<ExperienceRound>) =>
    setRounds((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, d: -1 | 1) =>
    setRounds((rs) => {
      const next = [...rs];
      const j = i + d;
      if (j < 0 || j >= next.length) return rs;
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });

  const validateStep = (s: number): Errors => {
    const e: Errors = {};
    if (s === 0) {
      if (!company) e.companyId = 'Choose a company';
      if (role.trim().length < 2) e.role = 'Add the role';
    }
    if (s === 1) {
      if (!rounds.length) e.rounds = 'Add at least one round';
      rounds.forEach((r, i) => {
        const res = experienceRoundSchema.safeParse(r);
        if (!res.success) {
          for (const issue of res.error.issues) e[`rounds.${i}.${String(issue.path[0])}`] ??= issue.message;
        }
      });
    }
    if (s === 3 && !ack) e.confidentialityAck = 'Please confirm';
    return e;
  };

  const next = () => {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    if (step < STEPS.length - 1) return setStep(step + 1);
    submit();
  };

  const submit = () => {
    const parsed = experienceCreateSchema.safeParse({
      companyId: company?.id,
      role: role.trim().toLowerCase(),
      year,
      rounds,
      difficulty,
      prepWeeks: prepWeeks === '' ? undefined : Number(prepWeeks),
      resources: resources
        .split('\n')
        .map((r) => r.trim())
        .filter((r) => r.length >= 2),
      tips,
      outcome,
      confidentialityAck: ack,
    });
    if (!parsed.success) {
      const e: Errors = {};
      for (const i of parsed.error.issues) e[i.path.join('.')] ??= i.message;
      setErrors(e);
      toast.error('Please check the highlighted fields');
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: (res) => {
        toast.success(res.pointsEarned ? `+${res.pointsEarned} helpfulness. Thank you for helping juniors!` : 'Experience shared');
        navigate(`/companies/${res.companySlug}#exp-${res.id}`);
      },
      onError: (err) => {
        if (err instanceof ApiError && err.fields) setErrors(err.fields);
        toast.error(err.message);
      },
    });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Share an interview experience" description="Structured experiences help every future batch prepare." />
      <div className="space-y-6 rounded-2xl border bg-card p-5 md:p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </p>
          <div className="mt-2 flex gap-1.5" aria-hidden>
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <FormField label="Company" error={errors.companyId}>
              <Select value={companySlug || undefined} onValueChange={setCompanySlug}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies?.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Role" htmlFor="role" error={errors.role}>
                <Input id="role" value={role} maxLength={60} placeholder="e.g. Software engineer intern" onChange={(e) => setRole(e.target.value)} />
              </FormField>
              <FormField label="Year">
                <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => thisYear - i).map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <div className="space-y-2">
              <Label>Overall difficulty</Label>
              <DifficultyDots value={difficulty} onChange={setDifficulty} size="lg" label="Overall difficulty" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            {errors.rounds && <p className="text-sm font-medium text-destructive">{errors.rounds}</p>}
            {rounds.map((r, i) => (
              <div key={i} className="space-y-3 rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Round {i + 1}</p>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                      <ArrowUp />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Move down"
                      onClick={() => move(i, 1)}
                      disabled={i === rounds.length - 1}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove round"
                      onClick={() => setRounds((rs) => rs.filter((_, j) => j !== i))}
                      disabled={rounds.length === 1}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Name" error={errors[`rounds.${i}.name`]}>
                    <Input value={r.name} maxLength={60} placeholder="e.g. Online assessment" onChange={(e) => setRound(i, { name: e.target.value })} />
                  </FormField>
                  <FormField label="Type">
                    <Select value={r.type} onValueChange={(v) => setRound(i, { type: v as ExperienceRound['type'] })}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROUND_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {ROUND_TYPE_LABEL[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
                <FormField label="Topics" error={errors[`rounds.${i}.topics`]}>
                  <ChipPicker value={r.topics} onChange={(v) => setRound(i, { topics: v })} options={[]} max={10} placeholder="e.g. arrays, dbms normalization" />
                </FormField>
                <div className="space-y-1.5">
                  <Label>Difficulty</Label>
                  <DifficultyDots value={r.difficulty} onChange={(d) => setRound(i, { difficulty: d })} size="lg" label={`Round ${i + 1} difficulty`} />
                </div>
                <FormField label="Notes (optional)">
                  <Textarea rows={2} maxLength={600} value={r.notes} onChange={(e) => setRound(i, { notes: e.target.value })} placeholder="Format, duration, what surprised you" />
                </FormField>
              </div>
            ))}
            {rounds.length < 8 && (
              <Button type="button" variant="outline" onClick={() => setRounds((rs) => [...rs, emptyRound()])}>
                <Plus /> Add round
              </Button>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <FormField label="Weeks of preparation (optional)" htmlFor="weeks">
              <Input id="weeks" type="number" min={0} max={104} value={prepWeeks} onChange={(e) => setPrepWeeks(e.target.value)} className="w-32" />
            </FormField>
            <FormField label="Resources (one per line)" hint="Books, courses, links that helped">
              <Textarea rows={4} value={resources} onChange={(e) => setResources(e.target.value)} />
            </FormField>
            <FormField label="Tips" htmlFor="tips">
              <Textarea id="tips" rows={4} maxLength={1500} value={tips} onChange={(e) => setTips(e.target.value)} placeholder="What would you tell a junior?" />
            </FormField>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Outcome</Label>
              <RadioGroup value={outcome} onValueChange={(v) => setOutcome(v as typeof outcome)}>
                {(
                  [
                    ['SELECTED', 'Selected'],
                    ['NOT_SELECTED', 'Not selected'],
                    ['WITHHELD', 'Prefer not to say'],
                  ] as const
                ).map(([v, l]) => (
                  <div key={v} className="flex items-center gap-2">
                    <RadioGroupItem value={v} id={`o-${v}`} />
                    <Label htmlFor={`o-${v}`} className="font-normal">
                      {l}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="rounded-xl bg-accent p-3 text-sm text-accent-foreground">
              Your experience will be labelled <strong>Self-reported</strong> unless verified by an admin. Don't share questions you agreed to keep confidential.
            </div>
            <div className="flex items-start gap-2.5">
              <Checkbox id="ack" checked={ack} onCheckedChange={(c) => setAck(c === true)} className="mt-0.5" />
              <Label htmlFor="ack" className="font-normal leading-snug">
                I confirm this doesn't break any confidentiality agreement.
              </Label>
            </div>
            {errors.confidentialityAck && <p className="text-xs font-medium text-destructive">{errors.confidentialityAck}</p>}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || create.isPending}>
            Back
          </Button>
          <Button onClick={next} disabled={create.isPending}>
            {create.isPending && <Loader2 className="animate-spin" />}
            {step === STEPS.length - 1 ? 'Share experience' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
