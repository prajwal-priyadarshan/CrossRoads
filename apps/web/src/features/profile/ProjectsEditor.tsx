import { Plus, Trash2 } from 'lucide-react';
import type { Project } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function ProjectsEditor({ value, onChange }: { value: Project[]; onChange: (v: Project[]) => void }) {
  const set = (i: number, patch: Partial<Project>) => onChange(value.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  return (
    <div className="space-y-4">
      {value.map((p, i) => (
        <div key={i} className="space-y-2 rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <Input
              value={p.title}
              onChange={(e) => set(i, { title: e.target.value })}
              placeholder="Project title"
              aria-label="Project title"
              maxLength={80}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove project"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              <Trash2 />
            </Button>
          </div>
          <Textarea
            value={p.description}
            onChange={(e) => set(i, { description: e.target.value })}
            placeholder="What did you build and which skills did you use?"
            rows={2}
            maxLength={300}
            aria-label="Project description"
          />
          <Input
            value={p.url ?? ''}
            onChange={(e) => set(i, { url: e.target.value })}
            placeholder="https://… (optional)"
            aria-label="Project link"
          />
        </div>
      ))}
      {value.length < 8 && (
        <Button type="button" variant="outline" onClick={() => onChange([...value, { title: '', description: '', url: '' }])}>
          <Plus /> Add project
        </Button>
      )}
    </div>
  );
}
