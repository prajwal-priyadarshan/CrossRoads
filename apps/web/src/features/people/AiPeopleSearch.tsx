import { useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAiPeopleSearch } from './api';
import type { FilterValues } from './PeopleFilters';

/**
 * Free-text "describe who you're looking for" box. AI (or a deterministic
 * keyword fallback when AI is disabled) turns it into the same filters the
 * sidebar uses, then applies them — so results still come from the regular
 * ranked /people query, not a separate code path.
 */
export function AiPeopleSearch({ onApply }: { onApply: (patch: FilterValues, summary: string) => void }) {
  const [text, setText] = useState('');
  const [appliedSummary, setAppliedSummary] = useState<string | null>(null);
  const search = useAiPeopleSearch();

  const submit = () => {
    const query = text.trim();
    if (!query || search.isPending) return;
    search.mutate(query, {
      onSuccess: (res) => {
        const f = res.filters;
        onApply(
          {
            role: f.role ?? '',
            department: f.department ?? '',
            skills: f.skills.join(','),
            interests: f.interests.join(','),
            targetRole: f.targetRole ?? '',
            company: f.company ?? '',
            mentorAvailable: f.mentorAvailable ? 'true' : '',
          },
          f.summary,
        );
        setAppliedSummary(f.summary);
      },
    });
  };

  const clear = () => {
    setText('');
    setAppliedSummary(null);
    onApply(
      { role: '', department: '', skills: '', interests: '', targetRole: '', company: '', mentorAvailable: '' },
      '',
    );
  };

  return (
    <div className="space-y-2 rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <Sparkles className="size-4 text-primary" /> Describe who you're looking for
      </div>
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="e.g. alumni mentor who knows machine learning and works at a product company"
          aria-label="Describe who you're looking for"
        />
        <Button type="button" onClick={submit} disabled={!text.trim() || search.isPending}>
          {search.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Search
        </Button>
      </div>
      {search.isError && <p className="text-sm text-destructive">Couldn't search right now. Try again.</p>}
      {appliedSummary && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-primary-soft px-3 py-2 text-sm text-primary">
          <span>
            Searching for: <span className="font-medium">{appliedSummary}</span>
            {!search.data?.usedAI && ' (matched by keyword)'}
          </span>
          <button type="button" onClick={clear} aria-label="Clear AI search" className="shrink-0 rounded-full p-1 hover:bg-primary/10">
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
