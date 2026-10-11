import { Link } from 'react-router';
import { Database, Download, Eye, ShieldCheck, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Public, plain-language data-processing notice (phase-12 §6). Linked from the sign-up consent checkbox and
 * reachable without being signed in. Every claim here must match what the code actually does — see the
 * phase-12 doc's own warning: a compliance claim is a claim the college will rely on.
 */
export function DataNoticePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link to="/" aria-label="Home" className="flex items-center">
            <img src="/brand/crossroads-mark.png" alt="" className="block h-7 w-auto dark:hidden" />
            <img src="/brand/crossroads-mark-dark.png" alt="" className="hidden h-7 w-auto dark:block" />
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/home">Go to App</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <PageHeader
          title="How your data is used"
          description="What we collect, why, who can see it, and how to export or delete it — in plain language."
        />

        <Card className="mt-8 border-l-4 border-l-primary bg-primary/5 p-6">
          <p className="text-sm text-muted-foreground">
            This platform is built and run by students, for a college community. It is not a substitute for your
            college's own data-protection or IT-security policy — if those two ever disagree, your college's policy
            governs. We aim to follow the principles of India's Digital Personal Data Protection Act, 2023 (consent,
            using data only for the purpose you were told, and your right to access and erase your data), but we are
            not claiming formal legal compliance — verify current requirements with your college before relying on
            that.
          </p>
        </Card>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Database className="h-5 w-5 text-primary" /> What we collect
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Account:</strong> your college email (or, for alumni, any email
                you register with), and a password we never store in plain text.
              </li>
              <li>
                <strong className="text-foreground">Profile:</strong> name, department, batch and current year,
                company and job title (if you add them), bio, skills, interests, target roles and companies, goal
                track, what you can help with, what you're looking for, projects, achievements, and LinkedIn/GitHub
                links.
              </li>
              <li>
                <strong className="text-foreground">Activity:</strong> questions, answers, discussion posts,
                interview experiences, club reviews, roadmaps, direct messages you send, event RSVPs, donations
                (test mode), and your points and badge history.
              </li>
              <li>
                <strong className="text-foreground">Automatic:</strong> when you signed up and accepted this notice,
                and basic usage counts (how many questions you've asked or answered) used to compute your points and
                to show staff aggregate engagement numbers — never your individual activity log.
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Eye className="h-5 w-5 text-primary" /> Who can see what
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Other students and alumni</strong> can see your public profile
                fields, your posts, questions and answers. Your email, LinkedIn and GitHub links are shown only if
                you choose to show them, in your profile settings.
              </li>
              <li>
                <strong className="text-foreground">Direct messages</strong> are visible only to you and the person
                you're messaging — with one exception below.
              </li>
              <li>
                <strong className="text-foreground">The institution dashboard</strong> (placement cell, admins) shows
                aggregate numbers only — total active users, questions answered this month, engagement by
                department.
              </li>
              <li>
                <strong className="text-foreground">Admins</strong> can see your public profile and posts (the same
                as any other student can), and can look up your account to verify it or act on a report — this is
                the same moderation access described on the{' '}
                <Link to="/support" className="text-primary underline underline-offset-2">
                  Support page
                </Link>
                . They do not see your private messages unless a safeguarding coordinator reviews a specific
                reported conversation, below.
              </li>
              <li>
                <strong className="text-foreground">Safeguarding exception:</strong> if a conversation is reported
                for harassment or a safety concern, a designated safeguarding coordinator — a narrow role, not every
                admin — can read that specific reported conversation to review it. This is the only case where a
                staff member can see private message content, and it only happens after a report is filed.{' '}
                <Link to="/support" className="text-primary underline underline-offset-2">
                  Read how reporting works
                </Link>
                .
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Download className="h-5 w-5 text-primary" /> Export your data
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              From Your data in account settings, you can download a complete copy of your profile, posts, comments,
              connection requests, messages you've sent, event tickets and donation history, and your points history
              — as a readable file, any time.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Trash2 className="h-5 w-5 text-primary" /> Delete your account
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Deleting your account removes your profile, email, messages, connection requests, event tickets and
              points history completely.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              <strong className="text-foreground">One exception, on purpose:</strong> if you've asked a public
              question, answered one, shared an interview experience, or reviewed a club, that content stays —
              attributed to "a deleted user" instead of your name — because other students may have already relied
              on it. Removing it would break the answer for everyone who already found it. Your name is removed
              either way.
            </p>
          </Card>
        </div>

        <Card className="mt-6 p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="h-5 w-5 text-primary" /> Questions or concerns
          </h3>
          <p className="mt-3 text-sm text-muted-foreground">
            If something here doesn't match what you see in the app, or you have a question about your data, use the{' '}
            <Link to="/support" className="text-primary underline underline-offset-2">
              Support page
            </Link>{' '}
            to find how to reach your college's student support contact.
          </p>
        </Card>
      </main>
    </div>
  );
}
