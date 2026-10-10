import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { Building2, Compass, Loader2, MessageCircleQuestion, NotebookPen, Search, Target } from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useDebounce } from '@/hooks/useDebounce';
import { useHotkey } from '@/hooks/useHotkey';
import { useUiStore } from '@/stores/uiStore';
import { GROUPS, useSearch } from '@/features/search/api';

const ACTIONS = [
  { label: 'Ask a question', to: '/ask/new', icon: MessageCircleQuestion },
  { label: 'Find a mentor', to: '/people?mode=mentor', icon: Compass },
  { label: 'Browse companies', to: '/companies', icon: Building2 },
  { label: 'My prep', to: '/prep', icon: Target },
  { label: 'Share an experience', to: '/experiences/new', icon: NotebookPen },
];
const SUGGESTIONS = ['dsa roadmap', 'interview experience', 'coding club'];

export function CommandPalette() {
  const open = useUiStore((s) => s.paletteOpen);
  const setOpen = useUiStore((s) => s.setPaletteOpen);
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const debounced = useDebounce(q, 250);
  const ready = debounced.trim().length >= 2;
  const { data, isFetching } = useSearch({ q: debounced.trim(), limit: '4' }, open && ready);

  const toggle = useCallback(() => setOpen(!useUiStore.getState().paletteOpen), [setOpen]);
  useHotkey('k', toggle);

  const go = (to: string) => {
    setOpen(false);
    setQ('');
    navigate(to);
  };

  const groups = data ? GROUPS.filter((g) => data[g.key].length > 0) : [];

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Search questions, people, companies and more">
      {/* Results come from the server, so cmdk must not re-filter them */}
      <Command shouldFilter={false}>
        <CommandInput value={q} onValueChange={setQ} placeholder="Search questions, people, companies…" />
        <CommandList>
          {!ready && (
            <>
              <CommandGroup heading="Quick actions">
                {ACTIONS.map((a) => (
                  <CommandItem key={a.to} value={a.label} onSelect={() => go(a.to)}>
                    <a.icon /> {a.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Try searching">
                {SUGGESTIONS.map((s) => (
                  <CommandItem key={s} value={`try-${s}`} onSelect={() => setQ(s)}>
                    <Search /> {s}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {ready && isFetching && !data && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Searching…
            </div>
          )}
          {ready && data && groups.length === 0 && <CommandEmpty>No results for &ldquo;{debounced}&rdquo;.</CommandEmpty>}

          {ready &&
            groups.map((g) => (
              <CommandGroup key={g.key} heading={g.label}>
                {data![g.key].map((hit) => (
                  <CommandItem key={`${g.key}-${hit.id}`} value={`${g.key}-${hit.id}`} onSelect={() => go(hit.url)}>
                    <g.icon />
                    <div className="min-w-0">
                      <p className="truncate">{hit.title}</p>
                      {hit.subtitle && <p className="truncate text-xs text-muted-foreground">{hit.subtitle}</p>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}

          {ready && (
            <CommandGroup>
              <CommandItem value="see-all" onSelect={() => go(`/search?q=${encodeURIComponent(debounced.trim())}`)}>
                <Search /> See all results for &ldquo;{debounced.trim()}&rdquo;
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
