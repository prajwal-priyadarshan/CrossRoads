import type { Advisor } from '@bridgeup/shared';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ConnectDialog } from '@/features/people/ConnectDialog';
import { Button } from '@/components/ui/button';

export function AdvisorsCard({ advisors }: { advisors: Advisor[] }) {
  if (!advisors.length) return null;
  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4">
      <h2 className="font-display text-sm font-semibold">Alumni founders who can advise you</h2>
      <div className="space-y-3">
        {advisors.map((a) => (
          <div key={a.id} className="flex items-start gap-3">
            <UserAvatar user={a} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{a.fullName}</span>
                <RoleBadge role={a.role} currentYear={a.currentYear} />
              </div>
              {a.foundedNote && <p className="text-xs text-muted-foreground">{a.foundedNote}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{a.match.reasons.join(' · ')}</p>
            </div>
            <ConnectDialog
              recipient={a}
              defaultKind="MENTORSHIP"
              defaultTopic="Advice on my startup idea"
              trigger={
                <Button size="sm" variant="outline">
                  Connect
                </Button>
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}
