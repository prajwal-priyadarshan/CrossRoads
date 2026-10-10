import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { Building2, ExternalLink, Star, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { ListSkeleton, ProfileSkeleton } from '@/components/shared/Skeletons';
import { useMe } from '@/hooks/useMe';
import { useUpdateProfile } from '@/features/profile/api';
import { PersonCard } from '@/features/people/PersonCard';
import { ROUND_TYPE_LABEL } from '@/lib/labels';
import { isSafeUrl, titleCase } from '@/lib/utils';
import { useCompany, useCompanyAlumni, useCompanyExperiences } from './api';
import { CompanyLogo } from './CompaniesPage';
import { PrepRoadmap, RoundsTimeline, SkillsYouHave } from './CompanyParts';
import { ExperienceCard } from './ExperienceCard';

type Tab = 'overview' | 'experiences' | 'alumni' | 'prep';
const TABS: Tab[] = ['overview', 'experiences', 'alumni', 'prep'];
const ANY = '__any__';

function ExperiencesTab({ slug }: { slug: string }) {
  const [f, setF] = useState<Record<string, string>>({});
  const { data, isLoading } = useCompanyExperiences(slug, f);
  const { hash } = useLocation();
  const thisYear = new Date().getFullYear();

  // Deep links from search (#exp-<id>) scroll the card into view once loaded
  useEffect(() => {
    if (data && hash.startsWith('#exp-')) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [data, hash]);

  const sel = (key: string, label: string, options: { value: string; label: string }[]) => (
    <Select value={f[key] || ANY} onValueChange={(v) => setF((p) => ({ ...p, [key]: v === ANY ? '' : v }))}>
      <SelectTrigger size="sm" className="w-40" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>Any {label.toLowerCase()}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {sel('year', 'Year', Array.from({ length: 5 }, (_, i) => ({ value: String(thisYear - i), label: String(thisYear - i) })))}
        {sel('minDifficulty', 'Difficulty', [1, 2, 3, 4, 5].map((d) => ({ value: String(d), label: `${d}+ of 5` })))}
        {sel('roundType', 'Round type', Object.entries(ROUND_TYPE_LABEL).map(([value, label]) => ({ value, label })))}
      </div>
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : !data?.length ? (
        <EmptyState icon={Star} title="No experiences match" description="Try removing a filter, or be the first to share one." />
      ) : (
        data.map((e) => <ExperienceCard key={e.id} exp={e} />)
      )}
    </div>
  );
}

function AlumniTab({ slug, enabled }: { slug: string; enabled: boolean }) {
  const { data, isLoading } = useCompanyAlumni(slug, enabled);
  if (isLoading) return <ListSkeleton rows={3} />;
  if (!data?.length) {
    return <EmptyState icon={Users} title="No alumni here yet" description="Invite them! Admins can send alumni invites." />;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {data.map((p) => (
        <PersonCard key={p.id} person={p} />
      ))}
    </div>
  );
}

export function CompanyPage() {
  const { slug = '' } = useParams();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const { data: c, isLoading, error } = useCompany(slug);
  const { data: me } = useMe();
  const update = useUpdateProfile();
  const hashTab = hash.startsWith('#exp-') ? 'experiences' : (hash.slice(1) as Tab);
  const [tab, setTab] = useState<Tab>(TABS.includes(hashTab) ? hashTab : 'overview');

  useEffect(() => {
    if (TABS.includes(hashTab)) setTab(hashTab);
  }, [hashTab]);

  if (isLoading || !me) return <ProfileSkeleton />;
  if (error || !c) {
    return (
      <EmptyState
        icon={Building2}
        title="Company not found"
        action={
          <Button asChild>
            <Link to="/companies">All companies</Link>
          </Button>
        }
      />
    );
  }

  const firstYear = me.role === 'STUDENT' && (me.currentYear ?? 1) === 1;
  const toggleTarget = () => {
    const next = c.isTarget ? me.targetCompanies.filter((s) => s !== c.slug) : [...me.targetCompanies, c.slug].slice(0, 8);
    update.mutate(
      { targetCompanies: next },
      { onSuccess: () => toast.success(c.isTarget ? 'Removed from your targets' : 'Added to your targets') },
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-start gap-4">
          <CompanyLogo slug={c.slug} name={c.name} size="lg" />
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="font-display text-2xl font-semibold">{c.name}</h1>
            <p className="text-sm text-muted-foreground">{c.description}</p>
            {isSafeUrl(c.website) && (
              <a href={c.website!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                Website <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {c.roles.map((r) => (
            <span key={r} className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
              {titleCase(r)}
            </span>
          ))}
        </div>
        <p className="tabular text-sm text-muted-foreground">
          {c.stats.experiences} experience{c.stats.experiences === 1 ? '' : 's'}
          {c.stats.avgDifficulty !== null && ` · avg difficulty ${c.stats.avgDifficulty}/5`}
          {c.stats.avgPrepWeeks !== null && ` · ~${c.stats.avgPrepWeeks} weeks prep`}
          {c.visitMonth && ` · visits in ${c.visitMonth}`}
        </p>
        <div className="flex flex-wrap gap-2">
          {firstYear ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button disabled>Share your experience</Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Experiences come from students who have been through a process.</TooltipContent>
            </Tooltip>
          ) : (
            <Button onClick={() => navigate(`/experiences/new?company=${c.slug}`)}>Share your experience</Button>
          )}
          <Button variant={c.isTarget ? 'secondary' : 'outline'} onClick={toggleTarget} disabled={update.isPending}>
            {c.isTarget ? 'In my targets' : 'Add to my targets'}
          </Button>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as Tab);
          navigate({ hash: v }, { replace: true });
        }}
      >
        <TabsList className="h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="experiences">Experiences ({c.stats.experiences})</TabsTrigger>
          <TabsTrigger value="alumni">Alumni</TabsTrigger>
          <TabsTrigger value="prep">Prep roadmap</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="mb-4 font-display text-lg font-semibold">Interview rounds</h2>
            <RoundsTimeline rounds={c.rounds} />
          </section>
          <section className="rounded-2xl border bg-card p-5">
            <SkillsYouHave skills={c.skills} slug={c.slug} />
          </section>
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Latest experiences</h2>
              {c.stats.experiences > 2 && (
                <Button variant="link" size="sm" onClick={() => setTab('experiences')}>
                  See all
                </Button>
              )}
            </div>
            {c.latestExperiences.length ? (
              c.latestExperiences.map((e) => <ExperienceCard key={e.id} exp={e} />)
            ) : (
              <p className="text-sm text-muted-foreground">No experiences shared yet.</p>
            )}
          </section>
        </TabsContent>

        <TabsContent value="experiences" className="mt-6">
          <ExperiencesTab slug={c.slug} />
        </TabsContent>
        <TabsContent value="alumni" className="mt-6">
          <AlumniTab slug={c.slug} enabled={tab === 'alumni'} />
        </TabsContent>
        <TabsContent value="prep" className="mt-6">
          <div className="rounded-2xl border bg-card p-5">
            <PrepRoadmap items={c.prepRoadmap} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
