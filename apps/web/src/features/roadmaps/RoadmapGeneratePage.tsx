import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, Code2, Database, Lightbulb, Layers, GraduationCap, Briefcase, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/PageHeader';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const GOAL_TRACKS = [
  { value: 'PRODUCT', label: 'Product Company (SDE)', icon: Code2, desc: 'SDE, AI & product roles' },
  { value: 'SERVICE', label: 'IT Services', icon: Layers, desc: 'Consulting & systems roles' },
  { value: 'QUANT_FINANCE', label: 'Quant & Finance', icon: Database, desc: 'Trading, fintech & math' },
  { value: 'STARTUP', label: 'Campus Startup', icon: Lightbulb, desc: 'Founding & early building' },
  { value: 'RESEARCH', label: 'Research & Labs', icon: FlaskConical, desc: 'Papers & research labs' },
  { value: 'MS', label: 'MS / Higher Studies', icon: GraduationCap, desc: 'Master’s & PhD preparation' },
  { value: 'MBA', label: 'MBA', icon: Briefcase, desc: 'Management & consulting' },
] as const;

const TARGET_ROLES = ['SDE', 'SDE-2', 'Data Analyst', 'Data Scientist', 'ML Engineer', 'Product Manager', 'UX Designer', 'DevOps', 'Backend Engineer', 'Frontend Engineer'];

const LOADING_STEPS = [
  'Looking at alumni roadmaps',
  'Checking your target companies',
  'Comparing with your skills',
  'Writing your plan',
];

export function RoadmapGeneratePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [goalTrack, setGoalTrack] = useState(() => {
    const t = params.get('track');
    if (t === 'SOFTWARE_ENGINEERING' || t === 'DATA_SCIENCE') return 'PRODUCT';
    return t ?? '';
  });
  const [targetRole, setTargetRole] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(() => {
    const c = params.get('company');
    return c ? [c] : [];
  });
  const [loadStep, setLoadStep] = useState(0);
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api<{ items: Array<{ id: string; slug: string; name: string }> }>('/companies'),
  });
  const companies = companiesData?.items ?? [];

  const mut = useMutation({
    mutationFn: () =>
      api<any>('/roadmaps/generate', {
        method: 'POST',
        json: {
          goalTrack,
          targetRole: targetRole || undefined,
          targetCompanySlugs: selectedCompanies.length ? selectedCompanies : undefined,
        },
      }),
    onMutate: () => {
      setLoadStep(0);
      stepTimer.current = setInterval(() => {
        setLoadStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
      }, 1100);
    },
    onSuccess: (res) => {
      if (stepTimer.current) clearInterval(stepTimer.current);
      navigate(`/roadmaps/${res.id}`);
    },
    onError: () => {
      if (stepTimer.current) clearInterval(stepTimer.current);
      toast.error('Could not generate roadmap. Try again.');
    },
  });

  useEffect(() => () => { if (stepTimer.current) clearInterval(stepTimer.current); }, []);

  const toggleCompany = (slug: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : prev.length < 4 ? [...prev, slug] : prev,
    );
  };

  const canGenerate = Boolean(goalTrack);

  return (
    <div className="mx-auto max-w-2xl py-8 space-y-8">
      <PageHeader
        title="Generate my roadmap"
        description="Built from alumni roadmaps, journeys and the companies you're targeting."
      />

      {/* Goal track */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Goal track <span className="text-destructive">*</span></h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {GOAL_TRACKS.map(({ value, label, desc, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setGoalTrack(value)}
              className={cn(
                'flex flex-col items-center text-center gap-1.5 rounded-xl border p-3.5 text-sm font-medium transition',
                goalTrack === value
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'bg-card hover:bg-muted',
              )}
            >
              <Icon className="size-5 shrink-0 text-primary" />
              <span>{label}</span>
              <span className="text-[11px] font-normal text-muted-foreground">{desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Target role */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Target role <span className="text-muted-foreground font-normal">(optional)</span></h2>
        <Input
          list="role-suggestions"
          placeholder="e.g. SDE, Data Analyst, Product Manager"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
        />
        <datalist id="role-suggestions">
          {TARGET_ROLES.map((r) => <option key={r} value={r} />)}
        </datalist>
      </section>

      {/* Target companies */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">
          Target companies <span className="text-muted-foreground font-normal">(up to 4, optional)</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {companies.slice(0, 20).map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => toggleCompany(c.slug)}
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition',
                selectedCompanies.includes(c.slug)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-muted',
              )}
            >
              {selectedCompanies.includes(c.slug) && <Check className="inline size-3 mr-1" />}
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* Loading steps */}
      {mut.isPending && (
        <Card>
          <CardContent className="pt-4 space-y-2">
            {LOADING_STEPS.map((label, i) => (
              <div key={label} className={cn('flex items-center gap-2 text-sm', i > loadStep ? 'text-muted-foreground/40' : i < loadStep ? 'text-success' : 'text-foreground')}>
                {i < loadStep ? (
                  <Check className="size-4 text-success" />
                ) : i === loadStep ? (
                  <span className="size-4 animate-pulse rounded-full bg-primary/60" />
                ) : (
                  <span className="size-4 rounded-full bg-muted" />
                )}
                {label}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button onClick={() => mut.mutate()} disabled={!canGenerate || mut.isPending} className="w-full">
        {mut.isPending ? 'Generating your plan…' : 'Generate my plan'}
      </Button>
    </div>
  );
}
