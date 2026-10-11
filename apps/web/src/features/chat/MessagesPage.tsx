import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CHAT_MESSAGE_MAX, type ChatConversation, type ChatMessage } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/shared/EmptyState';
import { ListSkeleton } from '@/components/shared/Skeletons';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { ReportButton } from '@/components/shared/ReportButton';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useConversations, useMarkRead, useMessages, useSendMessage } from './api';

function ConversationList({ activeId, items }: { activeId?: string; items: ChatConversation[] }) {
  return (
    <ul className="divide-y rounded-2xl border bg-card">
      {items.map((c) => (
        <li key={c.id}>
          <Link
            to={`/messages/${c.id}`}
            aria-current={activeId === c.id ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 p-3 transition hover:bg-muted/50',
              activeId === c.id && 'bg-primary-soft',
            )}
          >
            <UserAvatar user={c.other} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className={cn('min-w-0 truncate text-sm', c.unread > 0 ? 'font-semibold' : 'font-medium')}>{c.other.fullName}</span>
                {c.lastMessageAt && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    <RelativeTime iso={c.lastMessageAt} />
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className={cn('min-w-0 truncate text-xs', c.unread > 0 ? 'text-foreground' : 'text-muted-foreground')}>
                  {c.lastMessageMine ? 'You: ' : ''}
                  {c.lastMessagePreview || 'Say hello'}
                </p>
                {c.unread > 0 && (
                  <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                    {c.unread}
                  </span>
                )}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Thread({ id, other, onBack }: { id: string; other: ChatConversation['other']; onBack: () => void }) {
  const messages = useMessages(id);
  const send = useSendMessage(id);
  const markRead = useMarkRead(id);
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // Pages arrive newest first; display oldest first
  const ordered = useMemo<ChatMessage[]>(
    () => (messages.data?.pages.flatMap((p) => p.items) ?? []).slice().reverse(),
    [messages.data],
  );

  useEffect(() => {
    markRead.mutate();
    // Mark read once per opened thread and whenever new messages arrive while it is open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, ordered.length]);

  useLayoutEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [ordered.length]);

  const submit = () => {
    const body = draft.trim();
    if (!body || send.isPending) return;
    send.mutate(
      { body },
      {
        onSuccess: () => setDraft(''),
        onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Message not sent. Try again.'),
      },
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b p-3">
        <Button variant="ghost" size="sm" className="md:hidden" onClick={onBack}>
          Back
        </Button>
        <UserAvatar user={other} size="sm" />
        <div className="min-w-0">
          <Link to={`/u/${other.handle}`} className="block truncate font-medium hover:underline">
            {other.fullName}
          </Link>
          <div className="truncate text-xs text-muted-foreground">
            {[other.jobTitle, other.company].filter(Boolean).join(' at ') || other.role.toLowerCase()}
          </div>
        </div>
        <ReportButton targetType="CONVERSATION" targetId={id} safetyOnly className="ml-auto shrink-0" />
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.hasNextPage && (
          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={() => messages.fetchNextPage()} disabled={messages.isFetchingNextPage}>
              {messages.isFetchingNextPage && <Loader2 className="animate-spin" />} Load earlier messages
            </Button>
          </div>
        )}
        {messages.isLoading ? (
          <ListSkeleton rows={3} />
        ) : ordered.length === 0 ? (
          <EmptyState icon={MessageCircle} title="No messages yet" description={`Say hello to ${other.fullName.split(' ')[0]}.`} />
        ) : (
          ordered.map((m) => (
            <div key={m.id} className={cn('flex', m.mine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm',
                  m.mine ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-muted',
                )}
              >
                {m.body}
                <div className={cn('mt-1 text-[10px]', m.mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                  <RelativeTime iso={m.createdAt} />
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <form
        className="flex items-end gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          maxLength={CHAT_MESSAGE_MAX}
          rows={1}
          placeholder="Write a message"
          aria-label="Message"
          className="max-h-40 min-h-10 resize-none"
        />
        <Button type="submit" size="icon" disabled={!draft.trim() || send.isPending} aria-label="Send message">
          {send.isPending ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </form>
    </div>
  );
}

export function MessagesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useConversations();
  const items = data ?? [];
  const active = items.find((c) => c.id === id);

  return (
    <div className="grid h-[calc(100dvh-8rem)] gap-4 md:grid-cols-[320px_minmax(0,1fr)]">
      <aside className={cn('min-h-0 overflow-y-auto', id && 'hidden md:block')}>
        <h1 className="mb-3 font-display text-xl font-semibold tracking-tight">Messages</h1>
        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No conversations yet"
            description="Once you connect with a senior, alumnus or peer, you can message them here."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/people">Find people</Link>
              </Button>
            }
          />
        ) : (
          <ConversationList activeId={id} items={items} />
        )}
      </aside>

      <section className={cn('min-h-0 rounded-2xl border bg-card', !id && 'hidden md:block')}>
        {!id ? (
          <EmptyState icon={MessageCircle} title="Pick a conversation" description="Your messages appear here." />
        ) : active ? (
          <Thread key={active.id} id={active.id} other={active.other} onBack={() => navigate('/messages')} />
        ) : (
          <EmptyState
            icon={MessageCircle}
            title="Conversation not found"
            description="It may belong to someone else, or it was removed."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/messages">Back to messages</Link>
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}
