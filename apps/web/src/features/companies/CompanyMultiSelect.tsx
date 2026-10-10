import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompanies } from './api';

/** Company toggle chips fed by GET /companies; shows names, stores slugs. */
export function CompanyMultiSelect({
  value,
  onChange,
  max = 8,
}: {
  value: string[];
  onChange: (slugs: string[]) => void;
  max?: number;
}) {
  const { data, isLoading } = useCompanies();
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading companies…</p>;
  const toggle = (slug: string) => {
    if (value.includes(slug)) onChange(value.filter((s) => s !== slug));
    else if (value.length < max) onChange([...value, slug]);
  };
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-2">
        {data?.map((c) => {
          const on = value.includes(c.slug);
          return (
            <button
              key={c.slug}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(c.slug)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition',
                on ? 'border-transparent bg-primary-soft text-primary' : 'bg-card text-muted-foreground hover:bg-muted',
              )}
            >
              {on && <Check className="size-3.5" />}
              {c.name}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {value.length}/{max} selected
      </p>
    </div>
  );
}
