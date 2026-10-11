import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { SearchGroup } from '@crossroads/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { ApiError } from '@/lib/api';
import { useAssistantAsk, type AssistantHistoryItem, type AssistantResponse } from './api';

type Message = { role: 'user' | 'assistant'; content: string; data?: AssistantResponse };

const GROUP_LABEL: Record<SearchGroup, string> = {
  questions: 'Questions',
  posts: 'Discussions',
  opportunities: 'Opportunities',
  experiences: 'Interview experiences',
  teams: 'Open teams',
  people: 'People',
  companies: 'Companies',
  stories: 'Success stories',
};

const DESTINATION: Record<NonNullable<AssistantResponse['destination']>, { to: string; label: string }> = {
  prep: { to: '/prep', label: 'Open placement prep' },
  'roadmaps-generate': { to: '/roadmaps/generate', label: 'Generate a roadmap' },
  'people-mentor': { to: '/people?mode=mentor', label: 'Find my alumni mentor' },
  'ask-new': { to: '/ask/new', label: 'Ask a new question' },
  'sim-setup': { to: '/prep/simulator', label: 'Start a mock interview' },
};

const GREETING: Message = {
  role: 'assistant',
  content:
    "Hi! I can help you find a mentor, search past questions and interview experiences, point you to prep tools, or explain how Crossroads itself works. What are you looking for?",
};

/** Floating chat concierge: routes free text to people search, platform search, a feature, or the project docs — one assistant for both "help me use this" and "how is this built" instead of two separate widgets. */
export function CrossroadsAssistant() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const ask = useAssistantAsk();

  const send = (e: FormEvent) => {
    e.preventDefault();
    const message = text.trim();
    if (!message || ask.isPending) return;
    const history: AssistantHistoryItem[] = messages
      .filter((m) => m !== GREETING)
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setText('');
    ask.mutate(
      { message, history },
      {
        onSuccess: (data) => setMessages((prev) => [...prev, { role: 'assistant', content: data.reply, data }]),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't reach the assistant. Try again."),
      },
    );
  };

  return (
    <>
      <Button
        className="fixed bottom-20 right-4 z-40 rounded-full shadow-md lg:bottom-6 lg:right-6"
        onClick={() => setOpen(true)}
        aria-label="Open Crossroads Assistant"
      >
        <Bot /> Ask the assistant
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-1.5">
              <Sparkles className="size-4 text-primary" /> Crossroads Assistant
            </SheetTitle>
            <SheetDescription>Find mentors, past answers and interview experiences, the right feature, or how Crossroads itself works.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-2">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={`max-w-[85%] space-y-2 rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {m.data?.action === 'people_search' && !!m.data.people?.length && (
                    <div className="space-y-1.5 pt-1">
                      {m.data.people.map((p) => (
                        <Link
                          key={p.id}
                          to={`/u/${p.handle}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2 rounded-xl bg-background/60 p-2 transition hover:bg-background"
                        >
                          <UserAvatar user={p} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">{p.fullName}</p>
                            <RoleBadge role={p.role} currentYear={p.currentYear} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {m.data?.action === 'search' &&
                    m.data.results &&
                    (Object.entries(m.data.results) as [SearchGroup, { id: string; title: string; subtitle: string; url: string }[]][])
                      .filter(([, hits]) => hits.length > 0)
                      .map(([group, hits]) => (
                        <div key={group} className="space-y-1 pt-1">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{GROUP_LABEL[group]}</p>
                          {hits.map((h) => (
                            <Link
                              key={h.id}
                              to={h.url}
                              onClick={() => setOpen(false)}
                              className="block rounded-xl bg-background/60 p-2 text-foreground transition hover:bg-background"
                            >
                              <p className="truncate font-medium">{h.title}</p>
                              <p className="truncate text-xs text-muted-foreground">{h.subtitle}</p>
                            </Link>
                          ))}
                        </div>
                      ))}

                  {m.data?.action === 'navigate' && m.data.destination && (
                    <Button asChild size="sm" className="mt-1" onClick={() => setOpen(false)}>
                      <Link to={DESTINATION[m.data.destination].to}>{DESTINATION[m.data.destination].label}</Link>
                    </Button>
                  )}

                  {m.data?.action === 'docs' && !!m.data.docs?.sources.length && (
                    <div className="space-y-1 pt-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">From the project docs</p>
                      {m.data.docs.sources.map((s) => (
                        <div key={s.n} className="rounded-xl bg-background/60 p-2 text-foreground">
                          <p className="truncate text-xs font-medium">
                            {s.file} › {s.heading}
                          </p>
                          <p className="line-clamp-2 text-xs text-muted-foreground">{s.excerpt}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {ask.isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={send} className="flex gap-2 border-t p-4">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={400}
              placeholder="e.g. find me a senior in cybersecurity"
              aria-label="Message the assistant"
            />
            <Button type="submit" size="icon" disabled={ask.isPending || !text.trim()} aria-label="Send">
              <Send className="size-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
