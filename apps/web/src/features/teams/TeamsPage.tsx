import { useState } from 'react';
import { Link } from 'react-router';
import { Plus, Rocket, UsersRound } from 'lucide-react';
import { TEAM_ROLES, type TeamKind } from '@bridgeup/shared';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/Skeletons';
import { titleCase } from '@/lib/utils';
import { AdvisorsCard } from './AdvisorsCard';
import { TeamCard } from './TeamCard';
import { useAdvisors, useTeams } from './api';

type Tab = 'HACKATHON' | 'PROJECT' | 'STARTUP' | 'STUDY_CIRCLE' | 'ALL';

const TABS: { value: Tab; label: string }[] = [
  { value: 'HACKATHON', label: 'Hackathons' },
  { value: 'PROJECT', label: 'Projects' },
  { value: 'STARTUP', label: 'Founder track' },
  { value: 'STUDY_CIRCLE', label: 'Study circles' },
  { value: 'ALL', label: 'All' },
];

export function TeamsPage() {
  const [tab, setTab] = useState<Tab>('HACKATHON');
  const [matchesMe, setMatchesMe] = useState(false);
  const [role, setRole] = useState('');
  const [includeClosed, setIncludeClosed] = useState(false);
  const kind = tab === 'ALL' ? undefined : (tab as TeamKind);
  const { data, isLoading } = useTeams({ kind, matchesMe, role: role || undefined, includeClosed });
  const { data: advisors } = useAdvisors();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Teams"
        description="Find teammates across departments — for hackathons, projects, startups and study circles."
        actions={
          <Button asChild>
            <Link to={`/teams/new?kind=${tab === 'ALL' ? 'HACKATHON' : tab}`}>
              <Plus className="size-4" /> Create a listing
            </Link>
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="flex-wrap">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.value === 'STARTUP' && <Rocket className="size-3.5" />}
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="matches-me" checked={matchesMe} onCheckedChange={setMatchesMe} />
            <Label htmlFor="matches-me" className="text-sm text-muted-foreground">
              Matches my skills
            </Label>
          </div>
          <Select value={role || 'any'} onValueChange={(v) => setRole(v === 'any' ? '' : v)}>
            <SelectTrigger size="sm" className="w-44" aria-label="Role needed">
              <SelectValue placeholder="Role needed" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any role</SelectItem>
              {TEAM_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {titleCase(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch id="show-closed" checked={includeClosed} onCheckedChange={setIncludeClosed} />
            <Label htmlFor="show-closed" className="text-sm text-muted-foreground">
              Show closed
            </Label>
          </div>
        </div>

        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-6 space-y-5">
            {t.value === 'STARTUP' && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/40">
                <p className="flex items-center gap-2 font-medium text-amber-900 dark:text-amber-200">
                  <Rocket className="size-4" /> Building a startup?
                </p>
                <p className="mt-1 text-amber-800/90 dark:text-amber-300/90">
                  Find co-founders — and alumni founders who can advise you.
                </p>
              </div>
            )}
            {t.value === 'STARTUP' && advisors && advisors.length > 0 && <AdvisorsCard advisors={advisors} />}

            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : !data?.length ? (
              <EmptyState
                icon={UsersRound}
                title="No listings here yet"
                description="Be the first to start one — teammates are looking too."
                action={
                  <Button asChild>
                    <Link to={`/teams/new?kind=${t.value === 'ALL' ? 'HACKATHON' : t.value}`}>Create a listing</Link>
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.map((team) => (
                  <TeamCard key={team.id} team={team} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
