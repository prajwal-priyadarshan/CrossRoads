import { useEffect, useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ConnectionKind, UserLite } from '@crossroads/shared';
import { connectionCreateSchema } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/shared/FormField';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ApiError } from '@/lib/api';
import { CONNECTION_KINDS } from '@/lib/people';
import { cn } from '@/lib/utils';
import { useCreateConnection } from '@/features/requests/api';

type Recipient = Pick<UserLite, 'id' | 'fullName' | 'avatarUrl'> & { mentorSlots?: string };

const EXAMPLES = [
  'Which ML project should I build first as a first year?',
  'How did you prepare for your internship interviews?',
  'What would you do differently in your second year?',
];

const PLACEHOLDER: Record<ConnectionKind, string> = {
  CONNECT: 'Say hello and why you would like to connect.',
  MENTORSHIP: 'Share a little about where you are and what kind of guidance would help.',
  COLLAB: 'Describe the project and what you would build together.',
  PEER_GUIDANCE: 'What are you working through that a peer could help with?',
};

export function ConnectDialog({
  recipient,
  defaultKind = 'CONNECT',
  defaultTopic = '',
  defaultMessage = '',
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  recipient: Recipient;
  defaultKind?: ConnectionKind;
  defaultTopic?: string;
  defaultMessage?: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const setOpen = onOpenChange ?? setInnerOpen;
  const [kind, setKind] = useState<ConnectionKind>(defaultKind);
  const [topic, setTopic] = useState(defaultTopic);
  const [message, setMessage] = useState(defaultMessage);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = useCreateConnection();
  const first = recipient.fullName.split(' ')[0];
  const needsTopic = kind === 'MENTORSHIP' || kind === 'PEER_GUIDANCE';

  useEffect(() => {
    if (open) {
      setKind(defaultKind);
      setTopic(defaultTopic);
      setMessage(defaultMessage);
      setErrors({});
    }
  }, [open, defaultKind, defaultTopic, defaultMessage]);

  const submit = () => {
    const body = { recipientId: recipient.id, kind, message, topic: needsTopic ? topic : undefined };
    const parsed = connectionCreateSchema.safeParse(body);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message;
      setErrors(next);
      return;
    }
    setErrors({});
    create.mutate(parsed.data, {
      onSuccess: () => {
        toast.success(`Request sent to ${first}`);
        setOpen(false);
      },
      onError: (e) => {
        if (e instanceof ApiError && e.fields) setErrors(e.fields);
        else toast.error(e.message);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <UserAvatar user={recipient} size="lg" />
            <div>
              <DialogTitle>Connect with {first}</DialogTitle>
              <DialogDescription>Choose how you would like to reach out.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(CONNECTION_KINDS) as ConnectionKind[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
              className={cn(
                'rounded-xl border p-3 text-left transition hover:border-primary/50',
                kind === k && 'border-primary bg-primary-soft',
              )}
            >
              <span className="block text-sm font-semibold">{CONNECTION_KINDS[k].label}</span>
              <span className="block text-xs text-muted-foreground">{CONNECTION_KINDS[k].hint}</span>
            </button>
          ))}
        </div>

        {needsTopic && (
          <FormField label="What do you want help with?" htmlFor="topic" error={errors.topic}>
            <Input
              id="topic"
              value={topic}
              maxLength={160}
              onChange={(e) => setTopic(e.target.value)}
              aria-invalid={!!errors.topic}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setTopic(ex)}
                  className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground transition hover:text-foreground"
                >
                  {ex}
                </button>
              ))}
            </div>
          </FormField>
        )}

        <FormField label="Message" htmlFor="message" error={errors.message}>
          <Textarea
            id="message"
            rows={4}
            value={message}
            maxLength={500}
            placeholder={PLACEHOLDER[kind]}
            onChange={(e) => setMessage(e.target.value)}
            aria-invalid={!!errors.message}
          />
          <p className="tabular text-right text-xs text-muted-foreground">{message.length}/500 (min 10)</p>
        </FormField>

        {recipient.mentorSlots && (
          <p className="text-xs text-muted-foreground">Usually available: {recipient.mentorSlots}</p>
        )}

        <Button onClick={submit} disabled={create.isPending} className="w-full">
          {create.isPending && <Loader2 className="animate-spin" />} Send request
        </Button>
      </DialogContent>
    </Dialog>
  );
}
