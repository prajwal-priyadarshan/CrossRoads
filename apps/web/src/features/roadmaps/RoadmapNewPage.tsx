import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { roadmapCreateSchema, type RoadmapStep } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/layout/PageHeader';
import { FormField } from '@/components/shared/FormField';
import { ApiError } from '@/lib/api';
import { useCreateRoadmap } from './api';
import { GoalTrackPicker } from './GoalTrackPicker';

type StepDraft = Omit<RoadmapStep, 'resources'> & { resources: string };
const newStep = (semester = 1): StepDraft => ({
  id: crypto.randomUUID().slice(0, 8),
  title: '',
  detail: '',
  semester,
  kind: 'SKILL',
  resources: '',
});

export function RoadmapNewPage() {
  const navigate = useNavigate();
  const create = useCreateRoadmap();
  const [goalTrack, setGoalTrack] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [steps, setSteps] = useState<StepDraft[]>([newStep(1), newStep(2), newStep(3)]);
  const [mistakes, setMistakes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setStep = (i: number, patch: Partial<StepDraft>) => setSteps((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) =>
    setSteps((s) => {
      const j = i + d;
      if (j < 0 || j >= s.length) return s;
      const next = [...s];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });

  const submit = () => {
    const parsed = roadmapCreateSchema.safeParse({
      goalTrack: goalTrack || undefined,
      title,
      summary,
      steps: steps.map((s) => ({
        ...s,
        resources: s.resources
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean)
          .slice(0, 5),
      })),
      mistakes: mistakes
        .split('\n')
        .map((m) => m.trim())
        .filter((m) => m.length >= 3),
    });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      for (const i of parsed.error.issues) e[i.path.join('.')] ??= i.message;
      setErrors(e);
      toast.error('Please check the highlighted fields');
      return;
    }
    setErrors({});
    create.mutate(parsed.data, {
      onSuccess: (r) => {
        toast.success(r.pointsEarned ? `+${r.pointsEarned} helpfulness. Thanks for sharing your path!` : 'Roadmap published');
        navigate(`/roadmaps/${r.id}`);
      },
      onError: (e) => {
        if (e instanceof ApiError && e.fields) setErrors(e.fields);
        toast.error(e.message);
      },
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Share your roadmap" description="The path you took, semester by semester, including the mistakes." />

      <div className="space-y-5 rounded-2xl border bg-card p-5">
        <FormField label="Goal" error={errors.goalTrack ? 'Choose a goal' : undefined}>
          <GoalTrackPicker value={goalTrack} onChange={setGoalTrack} />
        </FormField>
        <FormField label="Title" htmlFor="rm-title" error={errors.title}>
          <Input
            id="rm-title"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="How I got my first SDE internship in 4 months"
          />
        </FormField>
        <FormField label="Summary (optional)" htmlFor="rm-summary">
          <Textarea id="rm-summary" rows={3} maxLength={800} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </FormField>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Steps</h2>
          {errors.steps && <p className="text-sm font-medium text-destructive">{errors.steps}</p>}
        </div>
        {steps.map((s, i) => (
          <div key={s.id} className="space-y-3 rounded-2xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Step {i + 1}</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowUp />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === steps.length - 1}>
                  <ArrowDown />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove step"
                  onClick={() => setSteps((x) => x.filter((_, j) => j !== i))}
                  disabled={steps.length <= 1}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
            <FormField label="Title" error={errors[`steps.${i}.title`]}>
              <Input value={s.title} maxLength={100} onChange={(e) => setStep(i, { title: e.target.value })} />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Semester</Label>
                <Select value={String(s.semester)} onValueChange={(v) => setStep(i, { semester: Number(v) })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        Semester {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Kind</Label>
                <Select value={s.kind} onValueChange={(v) => setStep(i, { kind: v as StepDraft['kind'] })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SKILL">Skill</SelectItem>
                    <SelectItem value="PROJECT">Project</SelectItem>
                    <SelectItem value="RESOURCE">Resource</SelectItem>
                    <SelectItem value="PRACTICE">Practice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <FormField label="Details (optional)">
              <Textarea rows={2} maxLength={600} value={s.detail} onChange={(e) => setStep(i, { detail: e.target.value })} />
            </FormField>
            <FormField label="Resources (one per line, up to 5)">
              <Textarea rows={2} value={s.resources} onChange={(e) => setStep(i, { resources: e.target.value })} />
            </FormField>
          </div>
        ))}
        {steps.length < 30 && (
          <Button variant="outline" onClick={() => setSteps((x) => [...x, newStep(x.at(-1)?.semester ?? 1)])}>
            <Plus /> Add step
          </Button>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border bg-card p-5">
        <FormField label="Mistakes I made (one per line, optional)" hint="Honest lessons help juniors the most">
          <Textarea rows={3} value={mistakes} onChange={(e) => setMistakes(e.target.value)} />
        </FormField>
        <Button onClick={submit} disabled={create.isPending}>
          {create.isPending && <Loader2 className="animate-spin" />} Publish roadmap
        </Button>
      </div>
    </div>
  );
}
