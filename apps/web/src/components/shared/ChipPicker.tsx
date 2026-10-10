import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { cn, titleCase } from '@/lib/utils';

type Tone = 'primary' | 'warm' | 'neutral';

const TONE: Record<Tone, string> = {
  primary: 'bg-primary-soft text-primary',
  warm: 'bg-accent text-accent-foreground',
  neutral: 'bg-muted text-foreground',
};

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

/** Searchable multi-select with chips and optional custom values. */
export function ChipPicker({
  value,
  onChange,
  options,
  placeholder = 'Search or add',
  max,
  allowCustom = true,
  tone = 'primary',
  id,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  options: readonly string[];
  placeholder?: string;
  max?: number;
  allowCustom?: boolean;
  tone?: Tone;
  id?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const atMax = max !== undefined && value.length >= max;

  const q = norm(query);
  const suggestions = useMemo(
    () => options.filter((o) => !value.includes(o) && (!q || o.includes(q))).slice(0, 8),
    [options, value, q],
  );
  const canAddCustom = allowCustom && q.length > 0 && !value.includes(q) && !options.includes(q);
  const rows = [...suggestions, ...(canAddCustom ? [q] : [])];

  const add = (v: string) => {
    const n = norm(v);
    if (!n || value.includes(n) || atMax) return;
    onChange([...value, n]);
    setQuery('');
    setActive(0);
  };
  const remove = (v: string) => onChange(value.filter((x) => x !== v));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, Math.max(rows.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (rows[active]) add(rows[active]);
    } else if (e.key === 'Escape') setOpen(false);
    else if (e.key === 'Backspace' && !query && value.length) remove(value[value.length - 1]!);
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-card px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring/50">
        {value.map((v) => (
          <span key={v} className={cn('inline-flex items-center gap-1 rounded-full py-0.5 pl-2.5 pr-1 text-xs font-medium', TONE[tone])}>
            {titleCase(v)}
            <button
              type="button"
              onClick={() => remove(v)}
              aria-label={`Remove ${v}`}
              className="grid size-4 place-items-center rounded-full hover:bg-black/10"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={query}
          disabled={atMax}
          placeholder={atMax ? `Limit of ${max} reached` : value.length ? '' : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          className="min-w-[8ch] flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {open && rows.length > 0 && !atMax && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border bg-popover p-1 shadow-lg"
        >
          {rows.map((r, i) => (
            <li
              key={r}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                add(r);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm',
                i === active && 'bg-muted',
              )}
            >
              {canAddCustom && i === rows.length - 1 ? (
                <>
                  <Plus className="size-4" /> Add &ldquo;{r}&rdquo;
                </>
              ) : (
                titleCase(r)
              )}
            </li>
          ))}
        </ul>
      )}
      {max !== undefined && (
        <p className="mt-1 text-xs text-muted-foreground">
          {value.length}/{max} selected
        </p>
      )}
    </div>
  );
}

/** All options shown as toggle chips; for short lists such as interests and help vocabulary. */
export function ChipToggleGroup({
  value,
  onChange,
  options,
  tone = 'primary',
  max,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  options: readonly string[];
  tone?: Tone;
  max?: number;
}) {
  const toggle = (o: string) => {
    if (value.includes(o)) onChange(value.filter((x) => x !== o));
    else if (max === undefined || value.length < max) onChange([...value, o]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(o)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition',
              on ? cn('border-transparent', TONE[tone]) : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {titleCase(o)}
          </button>
        );
      })}
    </div>
  );
}
