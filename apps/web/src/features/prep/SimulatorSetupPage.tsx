import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { BrainCircuit, Code2, Cpu, MessageSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useStartSimulator } from './api';

const ROUND_TYPES = [
  { value: 'APTITUDE', label: 'Aptitude', icon: BrainCircuit, desc: 'Quantitative & logical reasoning' },
  { value: 'CODING', label: 'Coding (approach)', icon: Code2, desc: 'DSA and problem-solving approach' },
  { value: 'CS_FUNDAMENTALS', label: 'CS fundamentals', icon: Cpu, desc: 'OS, DBMS, networks, OOP' },
  { value: 'TECHNICAL', label: 'Technical interview', icon: MessageSquare, desc: 'System design and deep dives' },
  { value: 'HR', label: 'HR interview', icon: Users, desc: 'Behavioural and situational questions' },
] as const;

const MAX_Q_OPTIONS = [3, 5, 10] as const;

export function SimulatorSetupPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [companySlug, setCompanySlug] = useState(params.get('company') ?? '');
  const [roundType, setRoundType] = useState('');
  const [maxQuestions, setMaxQuestions] = useState<3 | 5 | 10>(5);

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api<{ items: Array<{ id: string; slug: string; name: string; _count?: { experiences: number } }> }>('/companies'),
  });
  const companies = companiesData?.items ?? [];

  const startMut = useStartSimulator();

  const handleStart = () => {
    if (!companySlug || !roundType) return;
    startMut.mutate(
      { companySlug, roundType, maxQuestions },
      { onSuccess: (res) => navigate(`/prep/simulator/${res.session?.id ?? res.id}`) },
    );
  };

  return (
    <div className="mx-auto max-w-2xl py-8 space-y-8">
      <PageHeader
        title="Practice simulator"
        description="Questions based on what seniors faced in real campus processes."
      />

      <p className="text-xs text-muted-foreground rounded-xl border bg-muted/40 px-4 py-2">
        Questions are original, written on topics seniors reported. We never show confidential questions.
      </p>

      {/* Company */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">1. Choose a company</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setCompanySlug(companies[0]?.slug ?? 'general')}
            className={cn(
              'flex flex-col items-start gap-1 rounded-xl border p-3 text-sm transition',
              !companySlug || companySlug === (companies[0]?.slug ?? 'general')
                ? 'border-primary bg-primary-soft text-primary'
                : 'bg-card hover:bg-muted',
            )}
          >
            <span className="font-medium">General practice</span>
            <span className="text-xs text-muted-foreground">Mixed questions</span>
          </button>
          {companies.slice(0, 5).map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setCompanySlug(c.slug)}
              className={cn(
                'flex flex-col items-start gap-1 rounded-xl border p-3 text-sm transition',
                companySlug === c.slug ? 'border-primary bg-primary-soft text-primary' : 'bg-card hover:bg-muted',
              )}
            >
              <span className="font-medium truncate w-full">{c.name}</span>
              {c._count?.experiences != null && (
                <span className="text-xs text-muted-foreground">Based on {c._count.experiences} experiences</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Round type */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">2. Choose a round</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ROUND_TYPES.map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRoundType(value)}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3 text-left transition',
                roundType === value ? 'border-primary bg-primary-soft' : 'bg-card hover:bg-muted',
              )}
            >
              <span className={cn('rounded-lg p-1.5', roundType === value ? 'bg-primary/20' : 'bg-muted')}>
                <Icon className={cn('size-4', roundType === value ? 'text-primary' : 'text-muted-foreground')} />
              </span>
              <div>
                <p className={cn('text-sm font-medium', roundType === value && 'text-primary')}>{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Max questions */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">3. Number of questions</h2>
        <div className="flex gap-3">
          {MAX_Q_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setMaxQuestions(n)}
              className={cn(
                'flex-1 rounded-xl border py-3 text-sm font-medium transition',
                maxQuestions === n ? 'border-primary bg-primary-soft text-primary' : 'bg-card hover:bg-muted',
              )}
            >
              {n} questions
            </button>
          ))}
        </div>
      </section>

      <Button
        onClick={handleStart}
        disabled={!companySlug || !roundType || startMut.isPending}
        className="w-full"
        size="lg"
      >
        {startMut.isPending ? 'Starting…' : 'Start practice session'}
      </Button>
    </div>
  );
}
