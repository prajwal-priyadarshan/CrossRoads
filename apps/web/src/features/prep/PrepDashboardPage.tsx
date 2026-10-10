import { useState } from 'react';
import { Link } from 'react-router';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowRight, BookOpen, BrainCircuit, CheckCircle2, ChevronRight, Clock, Code2, Plus, Target, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { PREP_CATEGORY_LABEL } from '@/lib/labels';
import { cn } from '@/lib/utils';
import {
  useCreatePrepItem, useDeletePrepItem, useImportPrepItems,
  usePrepDashboard, useUpdatePrepItem
} from './api';

const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  OA: Code2,
  APTITUDE: BrainCircuit,
  TECHNICAL: BookOpen,
  HR: Users,
};

function ScoreRing({ score }: { score: number }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg className="size-20" viewBox="0 0 80 80" aria-label={`Readiness score ${score}%`}>
      <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
      <circle
        cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="8"
        className={score >= 70 ? 'text-emerald-500' : score >= 40 ? 'text-amber-500' : 'text-rose-500'}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="44" textAnchor="middle" className="fill-foreground text-xs font-bold" style={{ fontSize: 14, fontWeight: 700 }}>
        {score}%
      </text>
    </svg>
  );
}

function PrepTrackCard({ track, targetCompanies }: { track: any; targetCompanies: any[] }) {
  const [newTitle, setNewTitle] = useState('');
  const create = useCreatePrepItem();
  const update = useUpdatePrepItem();
  const del = useDeletePrepItem();
  const importItems = useImportPrepItems();
  const Icon = CATEGORY_ICON[track.category] ?? Target;

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    create.mutate({ category: track.category, title: newTitle.trim() });
    setNewTitle('');
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-muted p-1.5"><Icon className="size-4 text-muted-foreground" /></span>
          <CardTitle className="text-sm">{PREP_CATEGORY_LABEL[track.category] ?? track.category}</CardTitle>
          <span className="ml-auto text-xs text-muted-foreground">{track.done}/{track.total}</span>
        </div>
        <Progress value={track.total ? (track.done / track.total) * 100 : 0} className="h-1.5" aria-label={`${track.category} progress`} />
      </CardHeader>
      <CardContent className="space-y-2">
        <ul className="space-y-1 max-h-48 overflow-y-auto">
          {(track.items ?? []).map((item: any) => (
            <li key={item.id} className="group flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-muted/50">
              <Checkbox
                checked={item.done}
                onCheckedChange={(checked) => update.mutate({ id: item.id, done: checked === true })}
                aria-label={item.title}
              />
              <span className={cn('flex-1 text-xs', item.done && 'line-through text-muted-foreground')}>{item.title}</span>
              {item.companyId && <Badge variant="outline" className="text-xs py-0">{targetCompanies.find((c: any) => c.id === item.companyId)?.name ?? 'Company'}</Badge>}
              <button
                type="button"
                onClick={() => del.mutate(item.id)}
                className="hidden group-hover:block text-muted-foreground hover:text-destructive"
                aria-label="Delete item"
              >
                <Trash2 className="size-3" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-1">
          <Input
            placeholder="Add item…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="h-7 text-xs"
          />
          <Button size="sm" variant="ghost" onClick={handleAdd} disabled={create.isPending} className="h-7 px-2">
            <Plus className="size-3" />
          </Button>
        </div>
        {targetCompanies.length > 0 && (
          <button
            type="button"
            onClick={() => importItems.mutate(targetCompanies[0].id)}
            disabled={importItems.isPending}
            className="text-xs text-primary hover:underline"
          >
            Import from {targetCompanies[0].name}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export function PrepDashboardPage() {
  const { data, isLoading } = usePrepDashboard();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl py-8 space-y-6">
        <PageHeader title="My Prep" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const targets = data?.targets ?? { companies: [], roles: [] };
  const readiness: any[] = data?.readiness ?? [];
  const tracks: any[] = data?.tracks ?? [];
  const nextActions: any[] = data?.nextActions ?? [];
  const recentSims: any[] = data?.recentSims ?? [];
  const deadlines: any[] = data?.deadlines ?? [];

  return (
    <div className="mx-auto max-w-6xl py-8 space-y-8">
      <PageHeader
        title="My Prep"
        description={data?.stageCopy}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/prep/simulator">Start simulation</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/roadmaps/generate">Generate roadmap</Link>
            </Button>
          </div>
        }
      />

      {/* Empty state */}
      {targets.companies.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Target className="size-8 text-muted-foreground" />
            <p className="font-medium">Add your target companies to see readiness</p>
            <p className="text-sm text-muted-foreground">Go to your profile to add target companies and roles.</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/settings/profile">Update profile</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Readiness */}
      {readiness.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Company readiness</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {readiness.map((r) => (
              <Card key={r.companyId}>
                <CardContent className="pt-4 flex items-start gap-4">
                  <ScoreRing score={r.score} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{r.companyName}</p>
                    <p className="text-xs text-muted-foreground">Skills: {r.skill}% matched</p>
                    {r.missing?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {r.missing.map((s: string) => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    )}
                    {r.latestSimScore != null && (
                      <p className="text-xs text-muted-foreground mt-1">Last sim: {r.latestSimScore}%</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Button asChild variant="ghost" size="sm" className="h-7 text-xs px-2">
                        <Link to={`/companies/${r.companySlug}`}>View company <ChevronRight className="size-3" /></Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm" className="h-7 text-xs px-2">
                        <Link to={`/prep/simulator?company=${r.companySlug}`}>Practice</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Prep tracks */}
      {tracks.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Prep tracks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tracks.map((track) => (
              <PrepTrackCard key={track.category} track={track} targetCompanies={targets.companies} />
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Next actions */}
        {nextActions.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Next actions</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {nextActions.slice(0, 5).map((a, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <Link to={a.href} className="text-sm font-medium hover:underline flex items-center gap-1">
                        {a.label} <ArrowRight className="size-3" />
                      </Link>
                      <p className="text-xs text-muted-foreground">{a.reason}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Deadlines */}
        {deadlines.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Clock className="size-4 text-primary" /> Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {deadlines.map((d, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Badge>
                    {d.href ? <Link to={d.href} className="hover:underline truncate">{d.label}</Link> : <span className="truncate">{d.label}</span>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent sims */}
      {recentSims.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Recent simulations</h2>
          {recentSims.length >= 3 && (
            <Card className="p-4">
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={recentSims.map((s) => ({ name: s.companyName, score: Math.round((s.score / s.total) * 100) }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
          <div className="space-y-2">
            {recentSims.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border bg-card p-3 text-sm">
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{s.companyName}</span>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span className="text-muted-foreground capitalize">{s.roundType.replace('_', ' ').toLowerCase()}</span>
                </div>
                <Badge variant="outline">{s.score}/{s.total}</Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
                <Button asChild variant="ghost" size="sm" className="h-7 text-xs px-2">
                  <Link to={`/prep/simulator/${s.id}`}>Review</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
