import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function RailCard({
  title,
  href,
  linkLabel = 'See all',
  children,
  className,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-2xl border bg-card p-4', className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-semibold">{title}</h2>
        {href && (
          <Link to={href} className="text-xs font-medium text-primary hover:underline">
            {linkLabel}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function RailSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3 rounded-2xl border bg-card p-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}
