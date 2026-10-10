import { Link } from 'react-router';
import { ExternalLink, MessageSquare, UserPlus } from 'lucide-react';
import { OPPORTUNITY_TYPES, type OpportunityItem } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/shared/AppIcon';
import { BookmarkButton } from '@/components/shared/BookmarkButton';
import { ReasonChip } from '@/components/shared/ReasonChip';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { ReportButton } from '@/components/shared/ReportButton';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ConnectDialog } from '@/features/people/ConnectDialog';
import { OPPORTUNITY_TONE } from '@/lib/labels';
import { cn, isSafeUrl, titleCase } from '@/lib/utils';
import { DeadlineBadge } from './DeadlineBadge';

const TYPE_META = Object.fromEntries(OPPORTUNITY_TYPES.map((t) => [t.value, t]));

export function OpportunityCard({ item, isMine }: { item: OpportunityItem; isMine: boolean }) {
  const meta = item.opportunityType ? TYPE_META[item.opportunityType] : undefined;
  const tone = item.opportunityType ? OPPORTUNITY_TONE[item.opportunityType] : undefined;

  return (
    <article className="flex flex-col gap-3 rounded-2xl border bg-card p-4 transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className={cn('grid size-10 shrink-0 place-items-center rounded-xl', tone ?? 'bg-muted')}>
          <AppIcon name={meta?.icon ?? 'briefcase'} className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {meta && <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', tone)}>{meta.label}</span>}
            {item.deadline && <DeadlineBadge deadline={item.deadline} />}
          </div>
          <h3 className="mt-1.5 font-semibold leading-snug">
            <Link to={`/post/${item.id}`} className="hover:underline">
              {item.title}
            </Link>
          </h3>
          {item.organization && <p className="text-sm text-muted-foreground">{item.organization}</p>}
        </div>
        <BookmarkButton targetType="POST" targetId={item.id} bookmarked={item.bookmarked} />
      </div>

      {item.excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{item.excerpt}</p>}

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <UserAvatar user={item.author} size="sm" />
        <Link to={`/u/${item.author.handle}`} className="font-medium text-foreground hover:underline">
          {item.author.fullName}
        </Link>
        <RoleBadge role={item.author.role} currentYear={item.author.currentYear} />
        <span>
          · <RelativeTime iso={item.createdAt} />
        </span>
      </div>

      {(item.reason || item.tags.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {item.reason && <ReasonChip>{item.reason}</ReasonChip>}
          {item.tags.map((t) => (
            <Link
              key={t}
              to={`/community/tag/${encodeURIComponent(t)}`}
              className="rounded-full bg-muted px-2 py-0.5 text-xs hover:bg-accent"
            >
              {titleCase(t)}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-3">
        {isSafeUrl(item.externalUrl) && (
          <Button size="sm" asChild>
            <a href={item.externalUrl!} target="_blank" rel="noopener noreferrer">
              Apply <ExternalLink className="size-3.5" />
            </a>
          </Button>
        )}
        {!isMine && (
          <ConnectDialog
            recipient={item.author}
            defaultKind="CONNECT"
            defaultMessage={`Hi! I saw your post about '${item.title}' — could you tell me more?`}
            trigger={
              <Button size="sm" variant="outline">
                <UserPlus className="size-3.5" /> Connect with poster
              </Button>
            }
          />
        )}
        <Button size="sm" variant="ghost" asChild>
          <Link to={`/post/${item.id}`}>
            <MessageSquare className="size-3.5" />
            {item.commentCount} {item.commentCount === 1 ? 'comment' : 'comments'}
          </Link>
        </Button>
        <ReportButton targetType="POST" targetId={item.id} className="ml-auto text-muted-foreground" />
      </div>
    </article>
  );
}
