import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type TargetType = 'POST' | 'COMMENT' | 'EXPERIENCE' | 'PROFILE' | 'TEAM' | 'STORY' | 'CONVERSATION';

interface ReportButtonProps {
  targetType: TargetType;
  targetId: string;
  variant?: 'icon' | 'menu-item';
  className?: string;
  /** Shows only the harassment/safety option, for contexts (like a chat thread) where that's the point of the button. */
  safetyOnly?: boolean;
}

export function ReportButton({ targetType, targetId, variant = 'icon', className, safetyOnly = false }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(safetyOnly ? 'HARASSMENT' : 'SPAM');
  const [details, setDetails] = useState('');

  const mutation = useMutation({
    mutationFn: () => api('/reports', { method: 'POST', json: { targetType, targetId, reason, details } }),
    onSuccess: () => {
      setOpen(false);
      toast.success(
        reason === 'HARASSMENT'
          ? 'Reported. This goes to a safety reviewer, not the general moderation queue.'
          : 'Thanks — a moderator will review this.',
      );
    },
    onError: (err: any) => {
      if (err.message?.includes('already')) {
        toast.error('You already reported this.');
      } else {
        toast.error('Failed to submit report');
      }
      setOpen(false);
    },
  });

  const label = safetyOnly ? 'Report a safety concern' : 'Report';

  return (
    <>
      {variant === 'icon' ? (
        <Button variant="ghost" size="icon" className={className} onClick={() => setOpen(true)} title={label}>
          <Flag className="h-4 w-4" />
        </Button>
      ) : (
        <DropdownMenuItem onSelect={() => setOpen(true)} className={className}>
          <Flag className="mr-2 h-4 w-4" />
          <span>{label}</span>
        </DropdownMenuItem>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {safetyOnly ? 'Report this conversation' : `Report this ${targetType.toLowerCase()}`}
            </DialogTitle>
            <DialogDescription>
              {safetyOnly
                ? 'This is reviewed by a safety coordinator, separately from general content reports. They can see this conversation to review it.'
                : 'Help us keep the community safe.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!safetyOnly && (
              <RadioGroup value={reason} onValueChange={setReason}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SPAM" id="r1" />
                  <Label htmlFor="r1">Spam</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MISLEADING" id="r2" />
                  <Label htmlFor="r2">Misleading</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="INAPPROPRIATE" id="r3" />
                  <Label htmlFor="r3">Inappropriate</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="HARASSMENT" id="r4" />
                  <Label htmlFor="r4">Harassment or unsafe behavior — reviewed urgently, separately from other reports</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="OTHER" id="r5" />
                  <Label htmlFor="r5">Something else</Label>
                </div>
              </RadioGroup>
            )}

            <div className="space-y-2 pt-2">
              <Label>{safetyOnly ? 'What happened? (optional, but helps the reviewer)' : 'Additional details (optional)'}</Label>
              <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Provide any extra context..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>Submit Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
