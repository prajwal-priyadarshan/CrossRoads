import { useCallback } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Info, SlidersHorizontal, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/Skeletons';
import { cn } from '@/lib/utils';
import { usePeople } from './api';
import { FILTER_KEYS, PeopleFilters, type FilterValues } from './PeopleFilters';
import { PersonCard } from './PersonCard';

const ALL_KEYS = [...FILTER_KEYS, 'mode', 'sort'];

export function PeoplePage() {
  const [sp, setSp] = useSearchParams();
  const values: FilterValues = Object.fromEntries(ALL_KEYS.map((k) => [k, sp.get(k) ?? '']));
  const mode = values.mode === 'mentor' ? 'mentor' : 'all';
  const sort = values.sort || 'match';

  const update = useCallback(
    (patch: FilterValues) => {
      setSp(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v) next.set(k, v);
            else next.delete(k);
          }
          return next;
        },
        { replace: false },
      );
    },
    [setSp],
  );

  const clear = () => update(Object.fromEntries(FILTER_KEYS.map((k) => [k, ''])));
  const activeCount = FILTER_KEYS.filter((k) => values[k]).length;
  const params = Object.fromEntries(Object.entries(values).filter(([, v]) => v));
  const { data, isLoading, isFetching } = usePeople(params);
  const showTop = activeCount === 0 && mode === 'all' && !!data?.length;
  const top = showTop ? data!.slice(0, 3) : [];
  const rest = showTop ? data!.slice(3) : (data ?? []);

  return (
    <div>
      <PageHeader
        title="Discover people"
        description="Find seniors, alumni and peers who can help, and people you can help."
        actions={
          <div className="inline-flex rounded-xl border bg-card p-1" role="group" aria-label="Mode">
            {(
              [
                ['all', 'All people'],
                ['mentor', 'Find my alumni mentor'],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => update({ mode: m === 'all' ? '' : m })}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                  mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      {mode === 'mentor' && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-primary-soft p-3 text-sm text-primary">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            Showing alumni and seniors who are open to mentoring, ranked by your target companies, roles and skills.{' '}
            <Link to="/settings/profile#goals" className="font-medium underline">
              Update my targets
            </Link>
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[288px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border bg-card p-4">
            <PeopleFilters values={values} onChange={update} onClear={clear} />
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {isLoading ? 'Loading…' : `${data?.length ?? 0} ${data?.length === 1 ? 'person' : 'people'}`}
              {isFetching && !isLoading && ' · updating'}
            </p>
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal /> Filters{activeCount ? ` (${activeCount})` : ''}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl px-4 pb-6">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <PeopleFilters values={values} onChange={update} onClear={clear} />
                </SheetContent>
              </Sheet>
              <Select value={sort} onValueChange={(v) => update({ sort: v === 'match' ? '' : v })}>
                <SelectTrigger size="sm" className="w-40" aria-label="Sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="match">Best match</SelectItem>
                  <SelectItem value="helpful">Most helpful</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          )}

          {top.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-semibold">Top matches for you</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {top.map((p) => (
                  <PersonCard key={p.id} person={p} featured />
                ))}
              </div>
              {rest.length > 0 && <h2 className="pt-2 font-display text-lg font-semibold">Everyone</h2>}
            </div>
          )}

          {!isLoading && data?.length === 0 && (
            <EmptyState
              icon={Users}
              title="No one matches these filters yet"
              description="Try removing a filter or searching for something broader."
              action={<Button onClick={clear}>Clear filters</Button>}
            />
          )}

          {rest.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rest.map((p) => (
                <PersonCard key={p.id} person={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
