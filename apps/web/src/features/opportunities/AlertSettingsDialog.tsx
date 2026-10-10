import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { OPPORTUNITY_TYPES, type OpportunityType } from '@bridgeup/shared';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ChipPicker } from '@/components/shared/ChipPicker';
import { FormField } from '@/components/shared/FormField';
import { useTopics } from '@/features/community/api';
import { cn } from '@/lib/utils';
import { useAlertPrefs, useSaveAlertPrefs } from './api';

const KEYWORD_EXAMPLES = ['sde', 'ml internship', 'quant', 'research', 'referral'];

export function AlertSettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: prefs, isLoading } = useAlertPrefs(open);
  const { data: topics } = useTopics();
  const save = useSaveAlertPrefs();

  const [enabled, setEnabled] = useState(true);
  const [types, setTypes] = useState<OpportunityType[]>([]);
  const [topicIds, setTopicIds] = useState<number[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // Load the saved preferences each time the dialog opens
  useEffect(() => {
    if (open && prefs) {
      setEnabled(prefs.enabled);
      setTypes(prefs.opportunityTypes);
      setTopicIds(prefs.topicIds);
      setTags(prefs.tags);
    }
  }, [open, prefs]);

  const toggle = <T,>(list: T[], v: T, max: number) =>
    list.includes(v) ? list.filter((x) => x !== v) : list.length < max ? [...list, v] : list;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Opportunity alerts</DialogTitle>
          <DialogDescription>
            Get notified when someone shares an opportunity that matches what you are looking for.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading your preferences…</p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <Label htmlFor="alerts-enabled" className="font-medium">
                Opportunity alerts
              </Label>
              <Switch id="alerts-enabled" checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <fieldset disabled={!enabled} className={cn('space-y-5', !enabled && 'opacity-50')}>
              <FormField label="Types" hint="Up to 8">
                <div className="flex flex-wrap gap-2">
                  {OPPORTUNITY_TYPES.map((t) => {
                    const on = types.includes(t.value);
                    return (
                      <button
                        key={t.value}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setTypes(toggle(types, t.value, 8))}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                          on ? 'border-transparent bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-muted',
                        )}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </FormField>

              <FormField label="Topics" hint="Up to 6">
                <div className="flex flex-wrap gap-2">
                  {(topics ?? []).map((t) => {
                    const on = topicIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setTopicIds(toggle(topicIds, t.id, 6))}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                          on ? 'border-transparent bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-muted',
                        )}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </FormField>

              <FormField label="Keywords" hint="Matched against the tags on a post">
                <ChipPicker value={tags} onChange={setTags} options={KEYWORD_EXAMPLES} max={10} tone="neutral" />
              </FormField>
            </fieldset>

            <p className="text-xs text-muted-foreground">Alerts appear in your notifications. No emails.</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={save.isPending || isLoading}
            onClick={() =>
              save.mutate({ enabled, opportunityTypes: types, topicIds, tags }, { onSuccess: () => onOpenChange(false) })
            }
          >
            {save.isPending && <Loader2 className="animate-spin" />} Save preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
