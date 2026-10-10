import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { milestoneSchema, type Milestone, type MilestoneCategory } from '@bridgeup/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/components/shared/FormField';
import { JourneyTimeline, MILESTONE_CATEGORIES } from './JourneyTimeline';
import { useAddMilestone, useDeleteMilestone } from './api';

export function JourneyEditor({ milestones }: { milestones: Milestone[] }) {
  const add = useAddMilestone();
  const del = useDeleteMilestone();
  const [year, setYear] = useState('1');
  const [category, setCategory] = useState<MilestoneCategory>('PROJECT');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    const parsed = milestoneSchema.safeParse({ yearOfStudy: Number(year), category, title, description });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Check the form');
    setError('');
    add.mutate(parsed.data, {
      onSuccess: () => {
        setTitle('');
        setDescription('');
        toast.success('Milestone added');
      },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-xl border p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Year">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    Year {y}
                  </SelectItem>
                ))}
                <SelectItem value="5">After graduation</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Category">
            <Select value={category} onValueChange={(v) => setCategory(v as MilestoneCategory)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MILESTONE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <FormField label="Title" htmlFor="ms-title" error={error}>
          <Input id="ms-title" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />
        </FormField>
        <FormField label="Details (optional)" htmlFor="ms-desc">
          <Textarea id="ms-desc" rows={2} maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} />
        </FormField>
        <Button onClick={submit} disabled={add.isPending}>
          {add.isPending && <Loader2 className="animate-spin" />} Add milestone
        </Button>
      </div>

      {milestones.length > 0 ? (
        <JourneyTimeline milestones={milestones} onDelete={(id) => del.mutate(id, { onError: (e) => toast.error(e.message) })} />
      ) : (
        <p className="text-sm text-muted-foreground">No milestones yet. Add your first one above.</p>
      )}
    </div>
  );
}
