import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Bell, Briefcase, Plus } from 'lucide-react';
import { OPPORTUNITY_TYPES } from '@bridgeup/shared';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/layout/PageHeader';
import { AppIcon } from '@/components/shared/AppIcon';
import { EmptyState } from '@/components/shared/EmptyState';
import { FeedSkeleton } from '@/components/shared/Skeletons';
import { SortToggle } from '@/features/community/SortToggle';
import { useMe } from '@/hooks/useMe';
import { cn } from '@/lib/utils';
import { AlertSettingsDialog } from './AlertSettingsDialog';
import { OpportunityCard } from './OpportunityCard';
import { useOpportunities } from './api';

export function OpportunitiesPage() {
  const [params, setParams] = useSearchParams();
  const [type, setType] = useState('');
  const [sort, setSort] = useState<'closing' | 'newest'>('closing');
  const [showPast, setShowPast] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const { data: me } = useMe();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useOpportunities({
    type: type || undefined,
    sort,
    showPast,
  });

  // /opportunities?alerts=1 opens the alert settings straight away (used by notifications)
  useEffect(() => {
    if (params.get('alerts') === '1') {
      setAlertsOpen(true);
      params.delete('alerts');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Opportunities"
        description="Internships, hackathons, research, referrals and more — shared by your campus."
        actions={
          <>
            <Button asChild>
              <Link to="/opportunities/new">
                <Plus className="size-4" /> Share an opportunity
              </Link>
            </Button>
            <Button variant="outline" size="icon" aria-label="Alert settings" onClick={() => setAlertsOpen(true)}>
              <Bell className="size-4" />
            </Button>
          </>
        }
      />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {[{ value: '', label: 'All', icon: 'hash' }, ...OPPORTUNITY_TYPES].map((t) => (
          <button
            key={t.value || 'all'}
            type="button"
            aria-pressed={type === t.value}
            onClick={() => setType(t.value)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition',
              type === t.value ? 'border-transparent bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <AppIcon name={t.icon} className="size-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SortToggle
          value={sort}
          onChange={setSort}
          label="Sort opportunities"
          options={[
            { value: 'closing', label: 'Closing soon' },
            { value: 'newest', label: 'Newest' },
          ]}
        />
        <div className="flex items-center gap-2">
          <Switch id="show-past" checked={showPast} onCheckedChange={setShowPast} />
          <Label htmlFor="show-past" className="text-sm text-muted-foreground">
            Show past
          </Label>
        </div>
      </div>

      {isLoading ? (
        <FeedSkeleton rows={3} />
      ) : !items.length ? (
        <EmptyState
          icon={Briefcase}
          title="No open opportunities here yet"
          description="Share one you know about — students whose alerts match will hear about it."
          action={
            <Button asChild>
              <Link to="/opportunities/new">Share an opportunity</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {items.map((item) => (
              <OpportunityCard key={item.id} item={item} isMine={item.author.id === me?.id} />
            ))}
          </div>
          {hasNextPage && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}

      <AlertSettingsDialog open={alertsOpen} onOpenChange={setAlertsOpen} />
    </div>
  );
}
