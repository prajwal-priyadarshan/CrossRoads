import { cn } from '@/lib/utils';

export type Option<T extends string> = { value: T; label: string };

/** Segmented control used for sort and mode switches. */
export function SortToggle<T extends string>({
  value,
  onChange,
  options,
  label = 'Sort',
}: {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  label?: string;
}) {
  return (
    <div className="inline-flex rounded-xl border bg-card p-1" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition',
            value === o.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const COMMUNITY_SORTS: Option<'latest' | 'top' | 'top_all'>[] = [
  { value: 'latest', label: 'Latest' },
  { value: 'top', label: 'Top this week' },
  { value: 'top_all', label: 'Top all time' },
];
