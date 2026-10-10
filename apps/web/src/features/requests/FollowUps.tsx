import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { FollowUp } from '@crossroads/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFollowUps } from './api';

/** Shared checklist. Local state updates instantly; the server save is debounced 500 ms. */
export function FollowUps({ connectionId, initial }: { connectionId: string; initial: FollowUp[] }) {
  const [items, setItems] = useState<FollowUp[]>(initial);
  const [text, setText] = useState('');
  const save = useFollowUps();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dirty = useRef(false);

  useEffect(() => {
    if (!dirty.current) setItems(initial);
  }, [initial]);

  const commit = (next: FollowUp[]) => {
    dirty.current = true;
    setItems(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      save.mutate({ id: connectionId, followUps: next }, { onSettled: () => (dirty.current = false) });
    }, 500);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  const add = () => {
    const t = text.trim();
    if (t.length < 2 || items.length >= 10) return;
    commit([...items, { id: crypto.randomUUID(), text: t, done: false }]);
    setText('');
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Follow-ups</p>
      <ul className="space-y-1.5">
        {items.map((f) => (
          <li key={f.id} className="flex items-center gap-2">
            <Checkbox
              checked={f.done}
              onCheckedChange={(c) => commit(items.map((x) => (x.id === f.id ? { ...x, done: c === true } : x)))}
              aria-label={f.text}
            />
            <span className={cn('flex-1 text-sm', f.done && 'text-muted-foreground line-through')}>{f.text}</span>
            <button
              type="button"
              aria-label="Delete follow-up"
              onClick={() => commit(items.filter((x) => x.id !== f.id))}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      {items.length < 10 && (
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Add a next step…"
            maxLength={160}
            aria-label="New follow-up"
          />
          <Button type="button" variant="outline" size="icon" onClick={add} aria-label="Add follow-up">
            <Plus />
          </Button>
        </div>
      )}
    </div>
  );
}
