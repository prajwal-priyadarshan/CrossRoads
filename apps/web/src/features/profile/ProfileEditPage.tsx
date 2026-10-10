import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DEPARTMENTS,
  GOAL_TRACKS,
  HELP_VOCAB,
  INTERESTS,
  SKILLS,
  TARGET_ROLES,
  type Me,
  type ProfileUpdateInput,
} from '@bridgeup/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/PageHeader';
import { ChipPicker, ChipToggleGroup } from '@/components/shared/ChipPicker';
import { FormField } from '@/components/shared/FormField';
import { AppIcon } from '@/components/shared/AppIcon';
import { ProfileSkeleton } from '@/components/shared/Skeletons';
import { ApiError } from '@/lib/api';
import { useMe } from '@/hooks/useMe';
import { cn } from '@/lib/utils';
import { JourneyEditor } from './JourneyEditor';
import { ProjectsEditor } from './ProjectsEditor';
import { CompanyMultiSelect } from '@/features/companies/CompanyMultiSelect';
import { useProfile, useUpdateProfile } from './api';

type Tab = 'basics' | 'skills' | 'connect' | 'projects' | 'journey' | 'mentoring';
const HASH_TO_TAB: Record<string, Tab> = { goals: 'skills', skills: 'skills', privacy: 'connect', mentoring: 'mentoring' };

/** One tab = one form that saves only its own fields. */
function SaveBar({ onSave, saving, error }: { onSave: () => void; saving: boolean; error?: string }) {
  return (
    <div className="mt-6 flex items-center gap-3">
      <Button onClick={onSave} disabled={saving}>
        {saving && <Loader2 className="animate-spin" />} Save changes
      </Button>
      {error && (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function useSection(me: Me, pick: (m: Me) => ProfileUpdateInput) {
  const [state, setState] = useState<ProfileUpdateInput>(() => pick(me));
  const [error, setError] = useState('');
  const update = useUpdateProfile();
  const set = <K extends keyof ProfileUpdateInput>(k: K, v: ProfileUpdateInput[K]) => setState((s) => ({ ...s, [k]: v }));
  const save = () => {
    setError('');
    update.mutate(state, {
      onSuccess: () => toast.success('Profile updated'),
      onError: (e) => {
        const first = e instanceof ApiError && e.fields ? Object.values(e.fields)[0] : undefined;
        setError(first ?? e.message);
      },
    });
  };
  return { state, set, save, saving: update.isPending, error };
}

function Switches({ items, state, set }: { items: [keyof ProfileUpdateInput, string][]; state: ProfileUpdateInput; set: (k: any, v: any) => void }) {
  return (
    <div className="space-y-3 rounded-xl border p-4">
      {items.map(([key, label]) => (
        <div key={key} className="flex items-center justify-between">
          <Label htmlFor={String(key)} className="font-normal">
            {label}
          </Label>
          <Switch id={String(key)} checked={!!state[key]} onCheckedChange={(c) => set(key, c)} />
        </div>
      ))}
    </div>
  );
}

function Basics({ me }: { me: Me }) {
  const s = useSection(me, (m) => ({
    fullName: m.fullName,
    bio: m.bio,
    department: m.department ?? '',
    batchYear: m.batchYear ?? undefined,
    company: m.company ?? '',
    jobTitle: m.jobTitle ?? '',
  }));
  return (
    <div className="space-y-4">
      <FormField label="Full name" htmlFor="fullName">
        <Input id="fullName" value={s.state.fullName ?? ''} onChange={(e) => s.set('fullName', e.target.value)} />
      </FormField>
      <FormField label="Short bio" htmlFor="bio">
        <Textarea id="bio" rows={3} maxLength={280} value={s.state.bio ?? ''} onChange={(e) => s.set('bio', e.target.value)} />
        <p className="tabular text-right text-xs text-muted-foreground">{(s.state.bio ?? '').length}/280</p>
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Department">
          <Select value={s.state.department || undefined} onValueChange={(v) => s.set('department', v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose department" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Graduation year" htmlFor="batchYear">
          <Input
            id="batchYear"
            type="number"
            value={s.state.batchYear ?? ''}
            onChange={(e) => s.set('batchYear', e.target.value ? Number(e.target.value) : undefined)}
          />
        </FormField>
      </div>
      {(me.role === 'ALUMNI' || me.role === 'SENIOR') && (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Company" htmlFor="company">
            <Input id="company" value={s.state.company ?? ''} onChange={(e) => s.set('company', e.target.value)} />
          </FormField>
          <FormField label="Role" htmlFor="jobTitle">
            <Input id="jobTitle" value={s.state.jobTitle ?? ''} onChange={(e) => s.set('jobTitle', e.target.value)} />
          </FormField>
        </div>
      )}
      <SaveBar onSave={s.save} saving={s.saving} error={s.error} />
    </div>
  );
}

function SkillsGoals({ me }: { me: Me }) {
  const s = useSection(me, (m) => ({
    skills: m.skills,
    interests: m.interests,
    goalTrack: m.goalTrack ?? undefined,
    targetRoles: m.targetRoles,
    targetCompanies: m.targetCompanies,
  }));
  return (
    <div className="space-y-6">
      <FormField label="Skills">
        <ChipPicker value={s.state.skills ?? []} onChange={(v) => s.set('skills', v)} options={SKILLS} max={20} />
      </FormField>
      <FormField label="Interests">
        <ChipToggleGroup value={s.state.interests ?? []} onChange={(v) => s.set('interests', v)} options={INTERESTS} max={12} />
      </FormField>
      <div id="goals" className="scroll-mt-24 space-y-2">
        <Label>Goal track</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {GOAL_TRACKS.map((g) => {
            const on = s.state.goalTrack === g.value;
            return (
              <button
                key={g.value}
                type="button"
                aria-pressed={on}
                onClick={() => s.set('goalTrack', g.value)}
                className={cn(
                  'relative flex items-start gap-3 rounded-2xl border p-4 text-left transition hover:border-primary/50',
                  on && 'border-primary bg-primary-soft',
                )}
              >
                {on && <Check className="absolute right-3 top-3 size-4 text-primary" />}
                <AppIcon name={g.icon} className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  <span className="block text-sm font-semibold">{g.label}</span>
                  <span className="block text-xs text-muted-foreground">{g.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <FormField label="Target roles">
        <ChipPicker value={s.state.targetRoles ?? []} onChange={(v) => s.set('targetRoles', v)} options={TARGET_ROLES} max={5} />
      </FormField>
      <FormField label="Target companies" hint="Used by Find my alumni mentor and company pages.">
        <CompanyMultiSelect value={s.state.targetCompanies ?? []} onChange={(v) => s.set('targetCompanies', v)} />
      </FormField>
      <SaveBar onSave={s.save} saving={s.saving} error={s.error} />
    </div>
  );
}

function ConnectPrivacy({ me }: { me: Me }) {
  const s = useSection(me, (m) => ({
    canHelpWith: m.canHelpWith,
    lookingFor: m.lookingFor,
    linkedinUrl: m.linkedinUrl ?? '',
    githubUrl: m.githubUrl ?? '',
    showEmail: m.showEmail,
    showLinkedin: m.showLinkedin,
    showGithub: m.showGithub,
  }));
  return (
    <div className="space-y-6">
      <FormField label="I'm looking for">
        <ChipToggleGroup value={s.state.lookingFor ?? []} onChange={(v) => s.set('lookingFor', v)} options={HELP_VOCAB} tone="warm" />
      </FormField>
      <FormField label="I can help with">
        <ChipToggleGroup value={s.state.canHelpWith ?? []} onChange={(v) => s.set('canHelpWith', v)} options={HELP_VOCAB} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="LinkedIn URL" htmlFor="li">
          <Input id="li" value={s.state.linkedinUrl ?? ''} onChange={(e) => s.set('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/…" />
        </FormField>
        <FormField label="GitHub URL" htmlFor="gh">
          <Input id="gh" value={s.state.githubUrl ?? ''} onChange={(e) => s.set('githubUrl', e.target.value)} placeholder="https://github.com/…" />
        </FormField>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">What others can see</p>
        <Switches
          state={s.state}
          set={s.set}
          items={[
            ['showEmail', 'Show my email'],
            ['showLinkedin', 'Show my LinkedIn'],
            ['showGithub', 'Show my GitHub'],
          ]}
        />
      </div>
      <SaveBar onSave={s.save} saving={s.saving} error={s.error} />
    </div>
  );
}

function ProjectsAchievements({ me }: { me: Me }) {
  const s = useSection(me, (m) => ({ projects: m.projects ?? [], achievements: m.achievements ?? [] }));
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium">Projects</p>
        <ProjectsEditor
          value={(s.state.projects ?? []).map((p) => ({ ...p, description: p.description ?? '' }))}
          onChange={(v) => s.set('projects', v)}
        />
      </div>
      <FormField label="Achievements" hint="One per line, up to 10">
        <Textarea
          rows={4}
          value={(s.state.achievements ?? []).join('\n')}
          onChange={(e) => s.set('achievements', e.target.value.split('\n').filter((l) => l.trim().length > 0).slice(0, 10))}
        />
      </FormField>
      <SaveBar onSave={s.save} saving={s.saving} error={s.error} />
    </div>
  );
}

function Mentoring({ me }: { me: Me }) {
  const s = useSection(me, (m) => ({
    mentorAvailable: m.mentorAvailable,
    mentorTopics: m.mentorTopics,
    mentorSlots: m.mentorSlots,
    showOnMentorWall: m.showOnMentorWall,
  }));
  if (me.role !== 'SENIOR' && me.role !== 'ALUMNI') {
    return (
      <p className="text-sm text-muted-foreground">
        Mentoring opens up once you are a senior or alumnus. Until then, ask questions and connect with people ahead of you.
      </p>
    );
  }
  return (
    <div className="space-y-6">
      <Switches state={s.state} set={s.set} items={[['mentorAvailable', 'I am available as a mentor'], ['showOnMentorWall', 'Show me on the mentor wall']]} />
      <FormField label="Mentoring topics">
        <ChipPicker value={s.state.mentorTopics ?? []} onChange={(v) => s.set('mentorTopics', v)} options={[]} max={8} placeholder="e.g. ml projects" />
      </FormField>
      <FormField label="Usual availability" htmlFor="slots">
        <Input id="slots" value={s.state.mentorSlots ?? ''} maxLength={120} onChange={(e) => s.set('mentorSlots', e.target.value)} placeholder="Sat 5–6 pm" />
      </FormField>
      <SaveBar onSave={s.save} saving={s.saving} error={s.error} />
    </div>
  );
}

export function ProfileEditPage() {
  const { data: me } = useMe();
  const { data: profile } = useProfile(me?.handle ?? '');
  const { hash } = useLocation();
  const navigate = useNavigate();
  const initial = HASH_TO_TAB[hash.slice(1)] ?? ((hash.slice(1) as Tab) || 'basics');
  const [tab, setTab] = useState<Tab>(initial);

  useEffect(() => {
    const t = HASH_TO_TAB[hash.slice(1)] ?? (hash.slice(1) as Tab);
    if (t) setTab(t);
  }, [hash]);

  if (!me) return <ProfileSkeleton />;

  const tabs: { value: Tab; label: string; content: ReactNode }[] = [
    { value: 'basics', label: 'Basics', content: <Basics me={me} /> },
    { value: 'skills', label: 'Skills & goals', content: <SkillsGoals me={me} /> },
    { value: 'connect', label: 'Connect & privacy', content: <ConnectPrivacy me={me} /> },
    { value: 'projects', label: 'Projects', content: <ProjectsAchievements me={me} /> },
    { value: 'journey', label: 'Journey', content: <JourneyEditor milestones={profile?.milestones ?? []} /> },
    { value: 'mentoring', label: 'Mentoring', content: <Mentoring me={me} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Edit profile"
        description="Each tab saves on its own."
        actions={<Button variant="outline" onClick={() => navigate(`/u/${me.handle}`)}>View profile</Button>}
      />
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as Tab);
          navigate({ hash: v }, { replace: true });
        }}
      >
        <TabsList className="h-auto w-full flex-wrap justify-start">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-6 max-w-2xl rounded-2xl border bg-card p-5">
            {t.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
