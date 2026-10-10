import { useState } from 'react';
import { Link } from 'react-router';
import { Sparkles } from 'lucide-react';
import type { ClubSummary } from '@crossroads/shared';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/Skeletons';
import { useRail } from '@/features/home/api';
import { CLUB_CATEGORY_LABEL } from '@/lib/labels';
import { cn, titleCase } from '@/lib/utils';
import { useClubs } from './api';
import { RatingMeter } from './RatingMeter';

function ClubCard({ club, recruiting }: { club: ClubSummary; recruiting: boolean }) {
  return (
    <Link
      to={`/clubs/${club.slug}`}
      className="flex h-full flex-col gap-3 rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">{club.name}</p>
          <span className="text-xs text-muted-foreground">{CLUB_CATEGORY_LABEL[club.category]}</span>
        </div>
        {club.recruitmentMonth && (
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
              recruiting ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-muted text-muted-foreground',
            )}
          >
            {recruiting ? 'Recruiting this week' : `Recruits in ${club.recruitmentMonth}`}
          </span>
        )}
      </div>
      <p className="line-clamp-2 text-sm text-muted-foreground">{club.description}</p>
      <div className="space-y-2">
        <RatingMeter label="Usefulness" value={club.usefulness} tone="useful" />
        <RatingMeter label="Time cost" value={club.timeCost} tone="time" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {club.skillsGained.slice(0, 4).map((s) => (
          <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-xs">
            {titleCase(s)}
          </span>
        ))}
      </div>
      <p className="tabular mt-auto text-xs text-muted-foreground">
        {club.reviewCount} review{club.reviewCount === 1 ? '' : 's'}
        {club.timeCommitment && ` · ${club.timeCommitment}`}
      </p>
    </Link>
  );
}

export function ClubsPage() {
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('useful');
  const { data, isLoading } = useClubs({ category: category || undefined, sort });
  const { data: rail } = useRail();
  const clubEvents = (rail?.thisWeek ?? []).filter((e) => e.category === 'CLUB').map((e) => e.title.toLowerCase());
  const recruiting = (c: ClubSummary) =>
    clubEvents.some((t) => t.includes(c.name.toLowerCase()) || (c.slug === 'code-circle' && t.includes('coding club')));

  return (
    <div className="space-y-5">
      <PageHeader title="Clubs" description="Honest ratings from seniors: how useful, and how much time." />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[['', 'All'], ...Object.entries(CLUB_CATEGORY_LABEL)].map(([v, l]) => (
            <button
              key={v || 'all'}
              type="button"
              aria-pressed={category === v}
              onClick={() => setCategory(v!)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                category === v ? 'border-transparent bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger size="sm" className="w-40" aria-label="Sort clubs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="useful">Most useful</SelectItem>
            <SelectItem value="light">Lightest time</SelectItem>
            <SelectItem value="az">A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState icon={Sparkles} title="No clubs in this category yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <ClubCard key={c.id} club={c} recruiting={recruiting(c)} />
          ))}
        </div>
      )}
    </div>
  );
}
