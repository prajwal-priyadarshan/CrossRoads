import { Link } from 'react-router';
import { cn } from '@/lib/utils';

export function Logo({ className, to = '/home' }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn('flex items-center gap-2.5', className)}>
      <img src="/brand/crossroads-mark.png" alt="" className="h-7 w-auto" />
      <span className="font-display text-lg font-bold tracking-[0.12em] uppercase">Crossroads</span>
    </Link>
  );
}
