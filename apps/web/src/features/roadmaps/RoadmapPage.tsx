import type { ComponentType } from 'react';
import { Link, useParams } from 'react-router';
import { AlertTriangle, BookOpen, Brain, Check, Hammer, Map as MapIcon, Target } from 'lucide-react';
import type { RoadmapStepView } from '@bridgeup/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { BookmarkButton } from '@/components/shared/BookmarkButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { ProfileSkeleton } from '@/components/shared/Skeletons';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ConnectDialog } from '@/features/people/ConnectDialog';
import { GOAL_LABEL } from '@/lib/labels';
import { cn, isSafeUrl } from '@/lib/utils';
import { useRoadmap, useToggleSave, useToggleStep } from './api';

const KIND: Record<RoadmapStepView['kind'], { icon: ComponentType<{ className?: string }>; label: string }> = {
  SKILL: { icon: Brain, label: 'Skill' },
  PROJECT: { icon: Hammer, label: 'Project' },
  RESOURCE: { icon: BookOpen, label: 'Resource' },
  PRACTICE: { icon: Target, label: 'Practice' },
};

export function RoadmapPage() {
  const { id = '' } = useParams();
  const { data: r, isLoading, error } = useRoadmap(id);
  const save = useToggleSave(id);
  const step = useToggleStep(id);

  if (isLoading) return <ProfileSkeleton />;
  if (error || !r) {
    return (
      <EmptyState
        icon={MapIcon}
        title="Roadmap not found"
        action={
          <Button asChild>
            <Link to="/roadmaps">All roadmaps</Link>
          </Button>
        }
      />
    );
  }

  const done = new Set(r.completedSteps);
  const semesters = [...new Set(r.steps.map((s) => s.semester))].sort((a, b) => a - b);
  const completed = r.steps.filter((s) => done.has(s.id)).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">{GOAL_LABEL[r.goalTrack]}</span>
          {r.isAi && (
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              AI · personal
            </span>
          )}
        </div>
        <h1 className="font-display text-2xl font-semibold">{r.title}</h1>
        {r.summary && <p className="text-sm text-muted-foreground">{r.summary}</p>}
        {r.author && (
          <div className="flex flex-wrap items-center gap-3">
            <UserAvatar user={r.author} size="md" />
            <div className="min-w-0 flex-1">
              <Link to={`/u/${r.author.handle}`} className="font-semibold hover:underline">
                {r.author.fullName}
              </Link>
              <div>
                <RoleBadge role={r.author.role} currentYear={r.author.currentYear} />
              </div>
            </div>
            {!r.isAuthor && (
              <ConnectDialog
                recipient={r.author}
                defaultKind="MENTORSHIP"
                defaultTopic={`Your roadmap: ${r.title}`.slice(0, 160)}
                trigger={
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                }
              />
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant={r.saved ? 'secondary' : 'default'} onClick={() => save.mutate()} disabled={save.isPending}>
            {r.saved ? (
              <>
                <Check /> Saved
              </>
            ) : (
              'Save roadmap'
            )}
          </Button>
          <BookmarkButton targetType="ROADMAP" targetId={r.id} bookmarked={r.bookmarked} />
          <span className="tabular text-sm text-muted-foreground">
            {r.saveCount} save{r.saveCount === 1 ? '' : 's'}
          </span>
        </div>
        {r.saved && (
          <div className="space-y-1">
            <p className="tabular text-sm font-medium">
              {completed} of {r.steps.length} steps
            </p>
            <Progress value={(completed / Math.max(1, r.steps.length)) * 100} aria-label="Roadmap progress" />
          </div>
        )}
      </header>

      {semesters.map((sem) => (
        <section key={sem} className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Semester {sem}</h2>
          <ul className="space-y-2">
            {r.steps
              .filter((s) => s.semester === sem)
              .map((s) => {
                const isDone = done.has(s.id);
                const k = KIND[s.kind] ?? KIND.SKILL;
                return (
                  <li key={s.id} className={cn('flex items-start gap-3 rounded-xl border bg-card p-3 transition', isDone && 'bg-emerald-50/50 dark:bg-emerald-950/20')}>
                    <Checkbox
                      checked={isDone}
                      onCheckedChange={(c) => step.mutate({ stepId: s.id, done: c === true })}
                      aria-label={`Mark "${s.title}" as done`}
                      className="mt-0.5"
                    />
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground" title={k.label}>
                      <k.icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-sm font-medium', isDone && 'text-muted-foreground line-through')}>{s.title}</p>
                      {s.detail && <p className="text-sm text-muted-foreground">{s.detail}</p>}
                      {s.resources.length > 0 && (
                        <ul className="mt-1 space-y-0.5 text-xs">
                          {s.resources.map((res) => (
                            <li key={res} className="break-words">
                              {isSafeUrl(res) ? (
                                <a href={res} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  {res}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">{res}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {isDone && <Check className="size-4 shrink-0 text-success" />}
                  </li>
                );
              })}
          </ul>
        </section>
      ))}

      {r.mistakes.length > 0 && (
        <section className="space-y-2 rounded-2xl bg-accent p-4 text-accent-foreground">
          <h2 className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4" /> Mistakes I made
          </h2>
          <ul className="list-inside list-disc space-y-1 text-sm">
            {r.mistakes.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
