import { useState } from 'react';
import { Link } from 'react-router';
import { Building2, Search } from 'lucide-react';
import type { CompanyTile as Company } from '@crossroads/shared';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/Skeletons';
import { useMe } from '@/hooks/useMe';
import { gradientFor, titleCase } from '@/lib/utils';
import { useCompanies } from './api';

export function CompanyLogo({ slug, name, size = 'md' }: { slug: string; name: string; size?: 'md' | 'lg' }) {
  return (
    <span
      className={
        size === 'lg'
          ? 'grid size-16 shrink-0 place-items-center rounded-2xl text-2xl font-bold text-white'
          : 'grid size-11 shrink-0 place-items-center rounded-xl text-lg font-bold text-white'
      }
      style={{ background: gradientFor(slug) }}
      aria-hidden
    >
      {name[0]}
    </span>
  );
}

function CompanyTile({ c, target }: { c: Company; target: boolean }) {
  return (
    <Link
      to={`/companies/${c.slug}`}
      className="relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {target && (
        <span className="absolute right-0 top-3 rounded-l-full bg-warm px-2.5 py-0.5 text-xs font-semibold text-white">
          Your target
        </span>
      )}
      <div className="flex items-center gap-3">
        <CompanyLogo slug={c.slug} name={c.name} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{c.name}</p>
          {c.visitMonth && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Visits in {c.visitMonth}</span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {c.roles.map((r) => (
          <span key={r} className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
            {titleCase(r)}
          </span>
        ))}
      </div>
      <p className="tabular mt-auto text-xs text-muted-foreground">
        {c.experienceCount} experience{c.experienceCount === 1 ? '' : 's'} · {c.alumniCount} alumni
      </p>
    </Link>
  );
}

export function CompaniesPage() {
  const { data, isLoading } = useCompanies();
  const { data: me } = useMe();
  const [q, setQ] = useState('');
  const list = (data ?? []).filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="space-y-5">
      <PageHeader title="Companies that visit campus" description="Rounds, skills and real experiences from your seniors." />
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search companies" className="pl-9" aria-label="Search companies" />
      </div>
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon={Building2} title="No companies match" description="Try a different name." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <CompanyTile key={c.id} c={c} target={!!me?.targetCompanies.includes(c.slug)} />
          ))}
        </div>
      )}
    </div>
  );
}
