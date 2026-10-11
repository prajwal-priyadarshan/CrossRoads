import type { ReactNode } from 'react';
import { MessageCircleQuestion, Route, Users } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';

const BENEFITS = [
  { icon: MessageCircleQuestion, text: 'Answers from seniors who did it already' },
  { icon: Users, text: 'People matched to your goals' },
  { icon: Route, text: 'A plan for every semester' },
];

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden flex-col overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 15%, color-mix(in oklab, var(--accent) 35%, transparent) 0%, transparent 45%), radial-gradient(circle at 85% 85%, color-mix(in oklab, var(--warm) 25%, transparent) 0%, transparent 50%), radial-gradient(color-mix(in oklab, var(--primary-foreground) 10%, transparent) 1px, transparent 1px)',
            backgroundSize: 'auto, auto, 28px 28px',
          }}
        />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <Logo to="/" onDark />
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-10">
            <figure className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-6 backdrop-blur-sm">
              <blockquote className="font-display text-xl font-semibold leading-snug">
                &ldquo;I wish I had this in my first year.&rdquo;
              </blockquote>
            </figure>
            <ul className="space-y-4">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-primary-foreground/90">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                    <Icon className="size-4.5" aria-hidden="true" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-primary-foreground/70">No rankings. No pressure.</p>
        </div>
      </div>
      <div className="flex flex-col justify-center bg-background px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-sm animate-in fade-in slide-in-from-bottom-1 duration-300">
          <Logo to="/" className="mb-8 lg:hidden" />
          <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
