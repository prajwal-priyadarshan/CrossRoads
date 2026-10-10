import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { ExternalLink, Mail, Pencil, Trophy } from 'lucide-react';
import { Github, Linkedin } from '@/components/shared/BrandIcons';
import type { PublicProfile } from '@bridgeup/shared';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { MatchRing } from '@/components/shared/MatchRing';
import { ProfileSkeleton } from '@/components/shared/Skeletons';
import { ReasonChip } from '@/components/shared/ReasonChip';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { ConnectDialog } from '@/features/people/ConnectDialog';
import { personSubline, yearLabel } from '@/lib/people';
import { isSafeUrl, titleCase } from '@/lib/utils';
import { UserX } from 'lucide-react';
import { JourneyTimeline } from './JourneyTimeline';
import { useProfile } from './api';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="mb-3 font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Chips({ items, tone }: { items: string[]; tone: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span key={i} className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
          {titleCase(i)}
        </span>
      ))}
    </div>
  );
}

function OwnerPrompt({ text }: { text: string }) {
  return (
    <Link
      to="/settings/profile"
      className="block rounded-xl border border-dashed p-4 text-sm text-muted-foreground hover:bg-muted"
    >
      {text}
    </Link>
  );
}

function ConnectionAction({ p }: { p: PublicProfile }) {
  if (p.isOwner) {
    return (
      <Button asChild variant="outline">
        <Link to="/settings/profile">
          <Pencil /> Edit profile
        </Link>
      </Button>
    );
  }
  const c = p.connection;
  if (c && c.status === 'COMPLETED') return <span className="rounded-full bg-primary-soft px-3 py-1.5 text-sm font-medium text-primary">Mentorship completed</span>;
  if (c && c.status === 'ACCEPTED') return <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Connected</span>;
  if (c && c.status === 'PENDING')
    return <span className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">Request pending</span>;
  return <ConnectDialog recipient={p} trigger={<Button>Connect</Button>} />;
}

export function ProfilePage() {
  const { handle = '' } = useParams();
  const { data: p, isLoading, error } = useProfile(handle);

  if (isLoading) return <ProfileSkeleton />;
  if (error || !p) {
    return (
      <EmptyState
        icon={UserX}
        title="Profile not found"
        description="This person may not have finished joining BridgeUp yet."
        action={
          <Button asChild>
            <Link to="/people">Discover people</Link>
          </Button>
        }
      />
    );
  }

  const owner = p.isOwner;
  const contacts = [
    p.email && { href: `mailto:${p.email}`, icon: Mail, label: 'Email' },
    isSafeUrl(p.linkedinUrl) && { href: p.linkedinUrl!, icon: Linkedin, label: 'LinkedIn' },
    isSafeUrl(p.githubUrl) && { href: p.githubUrl!, icon: Github, label: 'GitHub' },
  ].filter(Boolean) as { href: string; icon: typeof Mail; label: string }[];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="h-28 bg-gradient-to-r from-indigo-500 to-violet-600" />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="rounded-full ring-4 ring-card">
              <UserAvatar user={p} size="xl" />
            </div>
            <div className="flex items-center gap-3">
              {p.match && <MatchRing score={p.match.score} size={52} />}
              <ConnectionAction p={p} />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold">{p.fullName}</h1>
              {p.isVerified && <VerifiedBadge />}
              <RoleBadge role={p.role} currentYear={p.currentYear} />
            </div>
            <p className="text-sm text-muted-foreground">
              {[p.department, yearLabel(p.role, p.currentYear, p.batchYear)].filter(Boolean).join(' · ')}
              {(p.company || p.jobTitle) && ` · ${personSubline({ ...p, department: null, currentYear: null })}`}
            </p>
            {contacts.length > 0 && (
              <div className="flex gap-2 pt-1">
                {contacts.map((c) => (
                  <a
                    key={c.label}
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={c.label}
                    className="grid size-8 place-items-center rounded-full border text-muted-foreground transition hover:text-foreground"
                  >
                    <c.icon className="size-4" />
                  </a>
                ))}
              </div>
            )}
            {p.match && p.match.reasons.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {p.match.reasons.slice(0, 3).map((r) => (
                  <ReasonChip key={r}>{r}</ReasonChip>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {(p.bio || owner) && (
            <Section title="About">
              {p.bio ? <p className="whitespace-pre-line text-sm leading-relaxed">{p.bio}</p> : <OwnerPrompt text="Add a short bio so people know how to help you." />}
            </Section>
          )}

          {(p.projects.length > 0 || owner) && (
            <Section title="Projects">
              {p.projects.length ? (
                <div className="space-y-3">
                  {p.projects.map((pr) => (
                    <div key={pr.title} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium">{pr.title}</h3>
                        {isSafeUrl(pr.url) && (
                          <a href={pr.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${pr.title}`}>
                            <ExternalLink className="size-4 text-muted-foreground hover:text-foreground" />
                          </a>
                        )}
                      </div>
                      {pr.description && <p className="mt-1 text-sm text-muted-foreground">{pr.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <OwnerPrompt text="Add your first project. It helps matching." />
              )}
            </Section>
          )}

          {(p.milestones.length > 0 || owner) && (
            <Section title="Journey">
              {p.milestones.length ? (
                <JourneyTimeline milestones={p.milestones} />
              ) : (
                <OwnerPrompt text="Add the milestones that shaped your path. Juniors with similar goals will find you." />
              )}
            </Section>
          )}

          {p.achievements.length > 0 && (
            <Section title="Achievements">
              <ul className="space-y-2">
                {p.achievements.map((a) => (
                  <li key={a} className="flex items-start gap-2 text-sm">
                    <Trophy className="mt-0.5 size-4 shrink-0 text-warm" />
                    {a}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        <aside className="space-y-6">
          {p.skills.length > 0 && (
            <Section title="Skills">
              <Chips items={p.skills} tone="bg-muted text-foreground" />
            </Section>
          )}
          {p.interests.length > 0 && (
            <Section title="Interests">
              <Chips items={p.interests} tone="bg-muted text-foreground" />
            </Section>
          )}
          {p.canHelpWith.length > 0 && (
            <Section title="I can help with">
              <Chips items={p.canHelpWith} tone="bg-primary-soft text-primary" />
            </Section>
          )}
          {p.lookingFor.length > 0 && (
            <Section title="I'm looking for">
              <Chips items={p.lookingFor} tone="bg-accent text-accent-foreground" />
            </Section>
          )}
          {p.targetRoles.length > 0 && (
            <Section title="Target roles">
              <Chips items={p.targetRoles} tone="bg-muted text-foreground" />
            </Section>
          )}
          {p.mentorAvailable && (
            <Section title="Mentoring">
              <div className="space-y-3 text-sm">
                {p.mentorTopics.length > 0 && <Chips items={p.mentorTopics} tone="bg-primary-soft text-primary" />}
                {p.mentorSlots && <p className="text-muted-foreground">Usually available: {p.mentorSlots}</p>}
                {!owner && !p.connection && (
                  <ConnectDialog
                    recipient={p}
                    defaultKind="MENTORSHIP"
                    trigger={<Button variant="outline" className="w-full">Request a session</Button>}
                  />
                )}
              </div>
            </Section>
          )}
          {(p.role === 'SENIOR' || p.role === 'ALUMNI' || owner) && p.points !== null && (
            <Section title="Contributions">
              <p className="text-sm text-muted-foreground">
                <span className="tabular font-semibold text-foreground">{p.points}</span> points. Badges arrive soon.
              </p>
            </Section>
          )}
        </aside>
      </div>
    </div>
  );
}
