import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Building2, HeartHandshake, MessageCircleQuestion, ThumbsUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/layout/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { MatchRing } from '@/components/shared/MatchRing';
import { ReasonChip } from '@/components/shared/ReasonChip';
import { UserAvatar } from '@/components/shared/UserAvatar';

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
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:px-8">
        <Logo to="/" />
        <nav className="ml-6 hidden items-center gap-5 text-sm text-muted-foreground md:flex">
          <Link to="/stories" className="hover:text-foreground">Stories</Link>
          <Link to="/support" className="hover:text-foreground">Support</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/register">Join with college email</Link>
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--primary-soft),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
              Built for first years, powered by seniors
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight md:text-6xl">
              Your seniors have walked your path. Now they can light it.
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
            <div key={title} className="rounded-2xl border bg-card p-6">
              <div className="mb-4 grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border bg-card p-6">
              <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        <div className="flex flex-col items-start gap-4 rounded-2xl bg-primary-soft p-8 md:flex-row md:items-center">
          <HeartHandshake className="size-10 shrink-0 text-primary" />
          <div className="flex-1">
            <h2 className="font-display text-xl font-semibold">
              No rankings. No pressure. Just people who want you to do well.
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Placement season is stressful. BridgeUp is built to make it kinder, and help is always one tap away.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/support">Visit Support</Link>
          </Button>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 border-t px-4 py-8 text-sm text-muted-foreground md:px-8">
        <span>© {new Date().getFullYear()} BridgeUp</span>
        <Link to="/support" className="hover:text-foreground">Support</Link>
        <Link to="/stories" className="hover:text-foreground">Stories</Link>
      </footer>
    </div>
  );
}
