import { useEffect, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { SearchX, Search as SearchIcon } from 'lucide-react';
import { DEPARTMENTS, TOPICS, type SearchHit } from '@bridgeup/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ListSkeleton } from '@/components/shared/Skeletons';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { GROUPS, useSearch } from './api';
import { useCompanies } from '@/features/companies/api';

const ANY = '__any__';
const thisYear = new Date().getFullYear();
const BATCHES = Array.from({ length: 12 }, (_, i) => thisYear + 4 - i);

/** Wraps query terms in <mark>; plain text only, never HTML. */
function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  const terms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!terms.length) return text;
  const re = new RegExp(`(${terms.join('|')})`, 'gi');
  return text.split(re).map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded bg-accent px-0.5 text-accent-foreground">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function HitRow({ hit, query, icon: Icon }: { hit: SearchHit; query: string; icon: (typeof GROUPS)[number]['icon'] }) {
  return (
    <li>
      <Link to={hit.url} className="flex items-start gap-3 rounded-xl border bg-card p-3 transition hover:border-primary/40">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
          <Icon className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block font-medium">
            <Highlight text={hit.title} query={query} />
          </span>
          {hit.subtitle && <span className="block truncate text-sm text-muted-foreground">{hit.subtitle}</span>}
        </span>
      </Link>
    </li>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value || ANY} onValueChange={(v) => onChange(v === ANY ? '' : v)}>
      <SelectTrigger size="sm" className="w-44" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>Any {label.toLowerCase()}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SearchPage() {
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') ?? '';
  const type = sp.get('type') ?? 'all';
  const [input, setInput] = useState(q);
  const { data: companies } = useCompanies();
  const debounced = useDebounce(input, 300);

  const set = (patch: Record<string, string>) =>
    setSp((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
      return next;
    });

  useEffect(() => {
    if (debounced.trim() !== q) set({ q: debounced.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);
  useEffect(() => {
    if (q !== debounced.trim()) setInput(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const params = {
    q,
    type,
    topic: sp.get('topic') ?? undefined,
    company: sp.get('company') ?? undefined,
    department: sp.get('department') ?? undefined,
    batch: sp.get('batch') ?? undefined,
    limit: type === 'all' ? '6' : '20',
  };
  const { data, isLoading, isFetching } = useSearch(params);
  const groups = data ? GROUPS.filter((g) => (type === 'all' || g.type === type) && data[g.key].length > 0) : [];
  const showPostFilters = ['all', 'question', 'post', 'opportunity'].includes(type);
  const showPeopleFilters = ['all', 'person', 'question', 'post', 'opportunity'].includes(type);
  const showCompany = ['all', 'experience', 'person'].includes(type);

  return (
    <div className="space-y-5">
      <PageHeader title="Search" description="Questions, people, companies, experiences and more from your campus." />
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search everything…"
          className="h-12 rounded-2xl pl-12 text-base"
          aria-label="Search"
          autoFocus
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[{ type: 'all', label: 'All' }, ...GROUPS].map((g) => (
          <button
            key={g.type}
            type="button"
            aria-pressed={type === g.type}
            onClick={() => set({ type: g.type === 'all' ? '' : g.type })}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition',
              type === g.type ? 'border-transparent bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {showPostFilters && (
          <FilterSelect
            label="Topic"
            value={sp.get('topic') ?? ''}
            onChange={(v) => set({ topic: v })}
            options={TOPICS.map((t) => ({ value: t.slug, label: t.name }))}
          />
        )}
        {showCompany && (
          <FilterSelect
            label="Company"
            value={sp.get('company') ?? ''}
            onChange={(v) => set({ company: v })}
            options={(companies ?? []).map((c) => ({ value: c.slug, label: c.name }))}
          />
        )}
        {showPeopleFilters && (
          <>
            <FilterSelect
              label="Department"
              value={sp.get('department') ?? ''}
              onChange={(v) => set({ department: v })}
              options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
            />
            <FilterSelect
              label="Batch"
              value={sp.get('batch') ?? ''}
              onChange={(v) => set({ batch: v })}
              options={BATCHES.map((b) => ({ value: String(b), label: `Class of ${b}` }))}
            />
          </>
        )}
      </div>

      {q.length < 2 ? (
        <p className="text-sm text-muted-foreground">Type at least 2 characters to search.</p>
      ) : isLoading ? (
        <ListSkeleton rows={4} />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={`Nothing found for "${q}"`}
          description="Try fewer words, or ask the community."
          action={
            <Button asChild>
              <Link to={`/ask/new?title=${encodeURIComponent(q)}`}>Ask the community</Link>
            </Button>
          }
        />
      ) : (
        <div className={cn('space-y-8', isFetching && 'opacity-70 transition-opacity')}>
          {groups.map((g) => (
            <section key={g.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">{g.label}</h2>
                {type === 'all' && data![g.key].length >= 6 && (
                  <Button variant="link" size="sm" onClick={() => set({ type: g.type })}>
                    See all {g.label.toLowerCase()}
                  </Button>
                )}
              </div>
              <ul className="space-y-2">
                {data![g.key].map((hit) => (
                  <HitRow key={hit.id} hit={hit} query={q} icon={g.icon} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
