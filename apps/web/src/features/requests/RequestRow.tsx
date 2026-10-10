import { useState } from 'react';
import { Link } from 'react-router';
import { Mail } from 'lucide-react';
import { Github, Linkedin } from '@/components/shared/BrandIcons';
import type { ConnectionRow, ContactUser } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { CONNECTION_KINDS, STATUS_PILL } from '@/lib/people';
import { cn, isSafeUrl, titleCase } from '@/lib/utils';
import { useComplete, useRespond } from './api';
import { FollowUps } from './FollowUps';

export function RequestRow({ row, meId }: { row: ConnectionRow; meId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [note, setNote] = useState('');
  const respond = useRespond();
  const complete = useComplete();

  const incoming = row.recipientId === meId;
  const other: ContactUser = incoming ? row.requester : row.recipient;
  const kind = CONNECTION_KINDS[row.kind];
  const canRespond = incoming && row.status === 'PENDING';
  const isGuidance = row.kind === 'MENTORSHIP' || row.kind === 'PEER_GUIDANCE';
  const canComplete = incoming && isGuidance && row.status === 'ACCEPTED';
  const open = row.status === 'ACCEPTED' || row.status === 'COMPLETED';

  const contacts = [
    other.email && { href: `mailto:${other.email}`, icon: Mail, label: 'Email' },
    isSafeUrl(other.linkedinUrl) && { href: other.linkedinUrl!, icon: Linkedin, label: 'LinkedIn' },
    isSafeUrl(other.githubUrl) && { href: other.githubUrl!, icon: Github, label: 'GitHub' },
  ].filter(Boolean) as { href: string; icon: typeof Mail; label: string }[];

  return (
    <article className="space-y-3 rounded-2xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <UserAvatar user={other} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/u/${other.handle}`} className="font-semibold hover:underline">
              {other.fullName}
            </Link>
            <RoleBadge role={other.role} currentYear={other.currentYear} />
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', kind.pill)}>{kind.label}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {incoming ? 'Received' : 'Sent'} <RelativeTime iso={row.createdAt} />
          </p>
        </div>
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_PILL[row.status])}>
          {titleCase(row.status.toLowerCase())}
        </span>
      </div>

      {row.topic && <p className="text-sm font-semibold">{row.topic}</p>}
      <div>
        <p className={cn('text-sm text-muted-foreground', !expanded && 'line-clamp-2')}>{row.message}</p>
        {row.message.length > 120 && (
          <button type="button" onClick={() => setExpanded((e) => !e)} className="text-xs font-medium text-primary">
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {open && contacts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {contacts.map((c) => (
            <Button key={c.label} variant="outline" size="sm" asChild>
              <a href={c.href} target="_blank" rel="noopener noreferrer">
                <c.icon /> {c.label}
              </a>
            </Button>
          ))}
        </div>
      )}

      {row.sessionNote && row.status === 'COMPLETED' && (
        <p className="rounded-xl bg-muted p-3 text-sm">
          <span className="font-medium">Session note: </span>
          {row.sessionNote}
        </p>
      )}

      {!incoming && row.status === 'COMPLETED' && row.followUps.length === 0 && (
        <p className="text-xs font-medium text-primary">Add follow-up actions so nothing gets lost ↓</p>
      )}

      {open && <FollowUps connectionId={row.id} initial={row.followUps} />}

      {(canRespond || canComplete) && (
        <div className="flex gap-2">
          {canRespond && (
            <>
              <Button size="sm" disabled={respond.isPending} onClick={() => respond.mutate({ id: row.id, status: 'ACCEPTED' })}>
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={respond.isPending}
                onClick={() => respond.mutate({ id: row.id, status: 'DECLINED' })}
              >
                Decline
              </Button>
            </>
          )}
          {canComplete && (
            <Button size="sm" variant="outline" onClick={() => setCompleting(true)}>
              Mark session completed
            </Button>
          )}
        </div>
      )}

      <Dialog open={completing} onOpenChange={setCompleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark session completed</DialogTitle>
            <DialogDescription>Add an optional note to remember what you covered.</DialogDescription>
          </DialogHeader>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500} placeholder="What did you discuss?" />
          <DialogFooter>
            <Button
              disabled={complete.isPending}
              onClick={() =>
                complete.mutate({ id: row.id, sessionNote: note.trim() || undefined }, { onSuccess: () => setCompleting(false) })
              }
            >
              Complete session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
