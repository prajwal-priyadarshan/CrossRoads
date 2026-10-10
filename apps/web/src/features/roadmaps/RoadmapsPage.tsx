import { Link, useSearchParams } from 'react-router';
import { Map as MapIcon, Plus } from 'lucide-react';
import type { RoadmapSummary } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { CardSkeleton } from '@/components/shared/Skeletons';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { SortToggle } from '@/features/community/SortToggle';
import { useMe } from '@/hooks/useMe';
import { GOAL_LABEL } from '@/lib/labels';
import { useRoadmaps } from './api';
import { GoalTrackPicker } from './GoalTrackPicker';

export function RoadmapCard({ r }: { r: RoadmapSummary }) {
  return (
    <Link
      to={`/roadmaps/${r.id}`}
      className="flex h-full flex-col gap-3 rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="w-fit rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">{GOAL_LABEL[r.goalTrack]}</span>
      <p className="font-semibold leading-snug">{r.title}</p>
      {r.summary && <p className="line-clamp-2 text-sm text-muted-foreground">{r.summary}</p>}
      <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
        {r.isAi ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            Personal plan
          </span>
        ) : (
          r.author && (
            <>
              <UserAvatar user={r.author} size="sm" />
              <span className="truncate font-medium text-foreground">{r.author.fullName}</span>
              <RoleBadge role={r.author.role} currentYear={r.author.currentYear} />
            </>
          )
        )}
      </div>
      <p className="tabular text-xs text-muted-foreground">
        {r.stepCount} steps · {r.saveCount} save{r.saveCount === 1 ? '' : 's'}
      </p>
      {r.saved && <Progress value={r.progress * 100} aria-label="Your progress" />}
    </Link>
  );
}

export function RoadmapsPage() {
  const [sp, setSp] = useSearchParams();
  const goal = sp.get('goal') ?? '';
  const view = sp.get('view') === 'mine' ? 'mine' : 'explore';
  const { data: me } = useMe();
  const { data, isLoading } = useRoadmaps(view === 'mine' ? { mine: true } : { goalTrack: goal || undefined });
  const helper = me?.role === 'SENIOR' || me?.role === 'ALUMNI';

  const set = (patch: Record<string, string>) =>
    setSp((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      return next;
    });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Roadmaps"
        description="Real paths from seniors who reached your goal."
        actions={
          <Button asChild variant={helper ? 'default' : 'outline'}>
            <Link to="/roadmaps/new">
              <Plus /> Share your roadmap
            </Link>
          </Button>
        }
      />
      <SortToggle<'explore' | 'mine'>
        label="View"
        value={view}
        onChange={(v) => set({ view: v === 'mine' ? 'mine' : '' })}
        options={[
          { value: 'explore', label: 'Explore' },
          { value: 'mine', label: 'My roadmaps' },
        ]}
      />
      {view === 'explore' && <GoalTrackPicker value={goal} onChange={(v) => set({ goal: v })} allowClear />}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState
          icon={MapIcon}
          title={view === 'mine' ? 'No roadmaps yet' : 'No roadmaps for this goal yet'}
          description={view === 'mine' ? 'Save a roadmap or tick a step to see it here.' : 'Be the first to share the path you took.'}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((r) => (
            <RoadmapCard key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}
