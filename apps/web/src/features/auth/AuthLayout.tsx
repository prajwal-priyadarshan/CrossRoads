import type { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';

const BENEFITS = ['Answers from seniors who did it already', 'People matched to your goals', 'A plan for every semester'];

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
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-10 text-white lg:flex">
        <Logo to="/" className="[&_span]:text-white" />
        <div className="space-y-8">
          <figure className="rounded-2xl bg-white/10 p-6 backdrop-blur">
            <blockquote className="font-display text-xl font-semibold leading-snug">
              &ldquo;I wish I had this in my first year.&rdquo;
            </blockquote>
            <figcaption className="mt-3 text-sm text-white/70">Example quote, not a real testimonial</figcaption>
          </figure>
          <ul className="space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-3 text-white/90">
                <CheckCircle2 className="size-5 text-amber-300" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-white/60">No rankings. No pressure.</p>
      </div>
      <div className="flex flex-col justify-center bg-background px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-sm">
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
