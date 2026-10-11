import { Link } from 'react-router';
import { useMe } from '@/hooks/useMe';
import { CAMPUS_NAV, CAREER_NAV, PRIMARY_NAV } from '@/components/layout/nav';
import { motion } from 'motion/react';
import { Building2, HeartHandshake, MessageCircleQuestion, ThumbsUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/layout/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { MatchRing } from '@/components/shared/MatchRing';
import { ReasonChip } from '@/components/shared/ReasonChip';
import { UserAvatar } from '@/components/shared/UserAvatar';

/** One line per page, so the landing page can show everything the app does. Labels and links come from the app's own nav. */
const FEATURE_BLURBS: Record<string, string> = {
  '/home': 'Your feed, this week, and what needs your attention',
  '/ask': 'Questions answered by seniors and alumni, with the best answer marked',
  '/community': 'Discussions by topic, with votes and comments',
  '/people': 'Find people by skills, goals and target companies, with reasons for each match',
  '/requests': 'Connections, mentorship and collaboration requests in one place',
  '/messages': 'Chat with the people you are connected to',
  '/prep': 'Your readiness per company, prep tracks and a practice simulator',
  '/companies': 'Campus company pages with roles, rounds and real interview experiences',
  '/roadmaps': 'Step-by-step paths from people who reached the same goal',
  '/path-twins': 'People who started where you did, and where they went',
  '/clubs': 'Honest reviews of clubs: time, skills gained and when to join',
  '/opportunities': 'Internships, hackathons, research and referrals shared on campus',
  '/teams': 'Find teammates for hackathons, projects, startups and study circles',
  '/stories': 'Journeys from your campus: placements, startups and research',
  '/support': 'Wellbeing resources and how to get help',
};

const FEATURE_GROUPS = [
  { title: 'Learn and ask', items: PRIMARY_NAV },
  { title: 'Career', items: CAREER_NAV },
  { title: 'Campus', items: CAMPUS_NAV },
];

const VALUE_CARDS = [
  {
    icon: MessageCircleQuestion,
    title: 'Ask a Senior',
    description: 'Get answers from people who sat the same exams and interviews, not generic internet advice.',
  },
  {
    icon: Users,
    title: 'Find your people',
    description: 'Match with seniors, alumni and teammates who share your goals, skills and department.',
  },
  {
    icon: Building2,
    title: 'Know every company',
    description: 'Real rounds, real questions and real outcomes from your own campus, company by company.',
  },
];

const STEPS = [
  { title: 'Join with your college email', description: 'Verified in a minute, so every voice is from your campus.' },
  { title: 'Tell us your goals', description: 'Pick a track, skills and what kind of help you want.' },
  { title: 'Get answers, people and a plan', description: 'A personalised home with matches and a weekly plan.' },
];

function PreviewCluster() {
  const float = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  });
  return (
    <div className="relative mx-auto grid w-full max-w-sm gap-4">
      <motion.div {...float(0.1)} className="rounded-2xl border bg-card p-4 shadow-sm">
        <p className="text-xs font-medium text-primary">Ask a Senior</p>
        <p className="mt-1 font-semibold">How did you prepare for the TCS Digital OA?</p>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <ThumbsUp className="size-3.5" /> 14 helpful · 3 answers
        </div>
      </motion.div>
      <motion.div {...float(0.25)} className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
        <UserAvatar user={{ id: 'demo-priya', fullName: 'Priya Nair' }} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Priya Nair</p>
          <ReasonChip>Same path: CSE to Product SDE</ReasonChip>
        </div>
        <MatchRing score={86} />
      </motion.div>
      <motion.div {...float(0.4)} className="rounded-2xl border bg-card p-4 shadow-sm">
        <p className="text-xs font-medium text-muted-foreground">This week</p>
        <ul className="mt-2 space-y-1.5 text-sm">
          <li>Solve 5 array problems</li>
          <li>Message one senior from your department</li>
          <li>Read one interview experience</li>
        </ul>
      </motion.div>
    </div>
  );
}

export function LandingPage() {
  const { data: me } = useMe();
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:px-8">
        <div className="flex items-center gap-2.5">
          <Logo to="/" />
          <span className="font-display text-lg font-bold tracking-tight">Crossroads</span>
        </div>
        <nav className="ml-6 hidden items-center gap-5 text-sm text-muted-foreground md:flex">
          <Link to="/stories" className="hover:text-foreground">Stories</Link>
          <Link to="/support" className="hover:text-foreground">Support</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {me ? (
            <Button asChild>
              <Link to="/home">Open the app</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild className="hidden sm:inline-flex">
                <Link to="/register">Join with college email</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--primary-soft),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-warm" />
              Built for Amrita Vishwa Vidyapeetham
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight md:text-6xl">
              Your seniors have walked your path. Now they can <span className="text-warm">light it.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Ask questions, find mentors, see real interview experiences from your campus, and plan your four years,
              with people who've been exactly where you are.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/register">Join with college email</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/stories">Read success stories</Link>
              </Button>
            </div>
          </div>
          <PreviewCluster />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {VALUE_CARDS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl border bg-card p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-4 grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8" aria-labelledby="features-heading">
        <h2 id="features-heading" className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Everything in one place
        </h2>
        <div className="mt-8 space-y-10">
          {FEATURE_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">{group.title}</h3>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <Link
                      to={me ? to : '/login'}
                      className="flex h-full gap-4 rounded-2xl border bg-card p-5 transition duration-200 hover:-translate-y-0.5 hover:border-warm/60 hover:shadow-md"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold">{label}</span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">{FEATURE_BLURBS[to]}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <div className="rounded-3xl bg-primary p-8 text-primary-foreground md:p-12">
          <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">How it works</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="grid size-9 place-items-center rounded-full bg-warm text-sm font-semibold text-primary">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm opacity-75">{s.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <div className="flex flex-col items-start gap-4 rounded-2xl bg-primary-soft p-8 md:flex-row md:items-center">
          <HeartHandshake className="size-10 shrink-0 text-primary" />
          <div className="flex-1">
            <h2 className="font-display text-xl font-semibold">
              No rankings. No pressure. Just people who want you to do well.
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Placement season is stressful. Help from people who have been through it is always one tap away.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/support">Visit Support</Link>
          </Button>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 border-t px-4 py-8 text-sm text-muted-foreground md:px-8">
        <span className="font-display font-semibold text-foreground">Crossroads</span>
        <span>© {new Date().getFullYear()}</span>
        <Link to="/support" className="hover:text-foreground">Support</Link>
        <Link to="/stories" className="hover:text-foreground">Stories</Link>
        <span className="ml-auto text-xs">Built for Amrita Vishwa Vidyapeetham</span>
      </footer>
    </div>
  );
}
