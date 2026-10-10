import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { TeamDetail } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/shared/FormField';
import { titleCase } from '@/lib/utils';
import { useApplyToTeam } from './api';

export function ApplyDialog({
  team,
  open,
  onOpenChange,
}: {
  team: TeamDetail;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [message, setMessage] = useState('');
  const apply = useApplyToTeam(team.id);
  const haveSkills = team.requiredSkills.filter((s) => team.skillMatch.includes(s));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply to {team.title}</DialogTitle>
          <DialogDescription>Why you'd be a great fit — mention your skills.</DialogDescription>
        </DialogHeader>

        {haveSkills.length > 0 && (
          <p className="text-sm text-muted-foreground">
            You already have: <span className="font-medium text-foreground">{haveSkills.map(titleCase).join(', ')}</span>
          </p>
        )}

        <FormField label="Message" htmlFor="apply-message">
          <Textarea
            id="apply-message"
            rows={4}
            value={message}
            maxLength={500}
            placeholder="Why you'd be a great fit — mention your skills."
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="tabular text-right text-xs text-muted-foreground">{message.length}/500 (min 10)</p>
        </FormField>

        <DialogFooter>
          <Button
            disabled={apply.isPending || message.trim().length < 10}
            onClick={() => apply.mutate(message, { onSuccess: () => onOpenChange(false) })}
          >
            {apply.isPending && <Loader2 className="animate-spin" />} Send application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
