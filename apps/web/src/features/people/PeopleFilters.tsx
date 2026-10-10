import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { DEPARTMENTS, INTERESTS, SKILLS, TARGET_ROLES } from '@bridgeup/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChipPicker, ChipToggleGroup } from '@/components/shared/ChipPicker';
import { useDebounce } from '@/hooks/useDebounce';
import { cn, titleCase } from '@/lib/utils';

export type FilterValues = Record<string, string>;

const ROLES = [
  { value: '', label: 'All' },
  { value: 'STUDENT', label: 'Students' },
  { value: 'SENIOR', label: 'Seniors' },
  { value: 'ALUMNI', label: 'Alumni' },
];

const csv = (s?: string) => (s ? s.split(',').filter(Boolean) : []);
const ANY = '__any__';

/** Filter keys that count as "active" (mode and sort are not filters). */
export const FILTER_KEYS = ['q', 'role', 'department', 'year', 'skills', 'interests', 'targetRole', 'company', 'mentorAvailable'];

export function PeopleFilters({
  values,
  onChange,
  onClear,
}: {
  values: FilterValues;
  onChange: (patch: FilterValues) => void;
  onClear: () => void;
}) {
  const [q, setQ] = useState(values.q ?? '');
  const debounced = useDebounce(q, 300);
  const [company, setCompany] = useState(values.company ?? '');
  const debouncedCompany = useDebounce(company, 300);

  useEffect(() => {
    if (debounced !== (values.q ?? '')) onChange({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);
  useEffect(() => {
    if (debouncedCompany !== (values.company ?? '')) onChange({ company: debouncedCompany });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedCompany]);
  // keep local inputs in sync when filters are cleared or restored via Back
  useEffect(() => {
    if ((values.q ?? '') !== debounced) setQ(values.q ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.q]);
  useEffect(() => {
    if ((values.company ?? '') !== debouncedCompany) setCompany(values.company ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.company]);

  const active = FILTER_KEYS.filter((k) => values[k]).length;

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name, company, skill…"
          className="pl-9"
          aria-label="Search people"
        />
      </div>

      <div className="space-y-2">
        <Label>Role</Label>
        <div className="flex flex-wrap gap-1.5">
          {ROLES.map((r) => (
            <button
              key={r.label}
              type="button"
              aria-pressed={(values.role ?? '') === r.value}
              onClick={() => onChange({ role: r.value })}
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition',
                (values.role ?? '') === r.value
                  ? 'border-transparent bg-primary-soft font-medium text-primary'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Department</Label>
          <Select value={values.department || ANY} onValueChange={(v) => onChange({ department: v === ANY ? '' : v })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Year</Label>
          <Select value={values.year || ANY} onValueChange={(v) => onChange({ year: v === ANY ? '' : v })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              {[1, 2, 3, 4].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  Year {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Skills</Label>
        <ChipPicker
          value={csv(values.skills)}
          onChange={(v) => onChange({ skills: v.join(',') })}
          options={SKILLS}
          placeholder="Filter by skill"
          allowCustom={false}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Interests</Label>
        <ChipToggleGroup
          value={csv(values.interests)}
          onChange={(v) => onChange({ interests: v.join(',') })}
          options={INTERESTS.slice(0, 8)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Target role</Label>
        <Select value={values.targetRole || ANY} onValueChange={(v) => onChange({ targetRole: v === ANY ? '' : v })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any</SelectItem>
            {TARGET_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {titleCase(r)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="company-filter">Company</Label>
        <Input
          id="company-filter"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="e.g. Northwind Labs"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="mentor-switch" className="font-normal">
          Available as mentor
        </Label>
        <Switch
          id="mentor-switch"
          checked={values.mentorAvailable === 'true'}
          onCheckedChange={(c) => onChange({ mentorAvailable: c ? 'true' : '' })}
        />
      </div>

      <Separator />
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{active} active filter{active === 1 ? '' : 's'}</span>
        <Button variant="link" size="sm" className="h-auto p-0" onClick={onClear} disabled={!active}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
